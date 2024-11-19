const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const WalletDB = require("../../models/wallet");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const getOrder = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page || 1);

    const totalOrders = await orderDB.countDocuments();

    const orders = await orderDB
      .find()
      .populate("userId", "username")
      .populate({
        path: "items.productId",
        select: "productName price discount category",
        populate: { path: "category", select: "discount" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const updatedOrders = orders.map((order) => {
      let totalAmount = 0;

      order.items = order.items.map((item) => {
        const itemTotal = item.discountedPrice * item.quantity;
        totalAmount += itemTotal;

        return {
          ...item.toObject(),
          itemTotal: itemTotal,
        };
      });

      if (totalAmount < 1000) {
        totalAmount += 50;
      }

      return {
        ...order.toObject(),
        totalAmount,
      };
    });

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    res.render("admin/order", {
      order: updatedOrders,
      currentPage: page,
      totalPages,
      itemsPerPage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const update_OrderStatus = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status } = req.body;

    const order = await orderDB.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const item = order.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in the order.",
      });
    }

    const product = await productDB.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in the database.",
      });
    }

    if (["Processing", "Pending", "Shipped", "Delivered"].includes(status)) {
      if (
        !["Processing", "Pending", "Shipped", "Delivered"].includes(item.status)
      ) {
        product.stock -= item.quantity;
      }
    } else if (status === "Cancelled") {
      if (item.status !== "Cancelled") {
        product.stock += item.quantity;
      }
    } else if (status === "Returned") {
      if (item.status !== "Returned") {
        product.stock += item.quantity;
      }
    }

    await product.save();

    item.status = status;

    if (status === "Delivered") {
      order.paymentStatus = "Completed";
    }

    if (status === "Returned") {
      order.paymentStatus = "Refunded";

      const userWallet = await WalletDB.findOne({ user: order.userId });

      if (userWallet) {
        const refundAmount = item.discountedPrice * item.quantity;
        userWallet.balance += refundAmount;
        userWallet.transactions.push({
          type: "Credit",
          amount: refundAmount,
          description: `Refund for returned product: ${item.productName}`,
        });

        await userWallet.save();
      } else {
        console.error("User wallet not found");
      }
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getReport = async (req, res) => {
  try {
    const { startDate, endDate, filter, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = { "items.status": "Delivered" };
    const today = new Date();
    let start, end;

    if (filter === "daily") {
      start = new Date(today);
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "weekly") {
      const firstDayOfWeek = today.getDate() - today.getDay();
      start = new Date(today.setDate(firstDayOfWeek));
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "monthly") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
      query.orderedDate = {
        $gte: start,
        $lte: end,
      };
    }

    const allOrders = await orderDB.find(query);

    const deliveredOrders = allOrders.filter((order) =>
      order.items.some((item) => item.status === "Delivered")
    );

    const totalSalesCount = deliveredOrders.length;

    const totalOrderAmount = deliveredOrders.reduce((total, order) => {
      const validPaymentMethods = [
        "wallet pay",
        "razorpay",
        "cash on delivery",
      ];
      const paymentMethod = order.paymentMethod.toLowerCase();

      if (validPaymentMethods.includes(paymentMethod)) {
        const validItemsTotal = order.items.reduce((itemTotal, item) => {
          if (item.status === "Delivered") {
            return itemTotal + item.price * item.quantity;
          }
          return itemTotal;
        }, 0);
        return total + validItemsTotal;
      }

      return total;
    }, 0);

    const userCount = [
      ...new Set(deliveredOrders.map((order) => order.userId.toString())),
    ].length;

    const orders = await orderDB
      .find(query)
      .populate("userId", "username")
      .sort({ orderedDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalSalesCount / limit);

    res.render("admin/sales", {
      orders,
      totalSalesCount,
      totalOrderAmount,
      userCount,
      startDate,
      endDate,
      filter,
      currentPage: Number(page),
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const download_Pdf = async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.orderedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (filter) {
      const today = new Date();
      if (filter === "daily") {
        query.orderedDate = {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else if (filter === "weekly") {
        const firstDayOfWeek = today.getDate() - today.getDay();
        const start = new Date(today.setDate(firstDayOfWeek));
        start.setHours(0, 0, 0, 0);
        query.orderedDate = {
          $gte: start,
          $lte: new Date(today.setDate(start.getDate() + 6)).setHours(
            23,
            59,
            59,
            999
          ),
        };
      } else if (filter === "monthly") {
        query.orderedDate = {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lte: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          ),
        };
      }
    }

    const orders = await orderDB.find(query).populate("userId", "username");

    const totalSalesCount = orders.length;
    const totalOrderAmount = orders.reduce((total, order) => {
      const validPaymentMethods = [
        "wallet pay",
        "razorpay",
        "cash on delivery",
      ];
      const paymentMethod = order.paymentMethod.toLowerCase();

      if (validPaymentMethods.includes(paymentMethod)) {
        const validItemsTotal = order.items.reduce((itemTotal, item) => {
          if (!["Cancelled", "Returned"].includes(item.status)) {
            return itemTotal + item.discountedPrice * item.quantity;
          }
          return itemTotal;
        }, 0);

        return total + validItemsTotal;
      }

      return total;
    }, 0);

    const doc = new PDFDocument({ margin: 20, size: "A3" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();

    if (startDate && endDate) {
      doc
        .fontSize(14)
        .text(
          `Date Range: ${new Date(
            startDate
          ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
          { align: "left" }
        );
    }
    if (filter) {
      doc
        .fontSize(14)
        .text(
          `Filter Based On: ${
            filter.charAt(0).toUpperCase() + filter.slice(1)
          }`,
          { align: "left" }
        );
    }
    doc.moveDown();

    doc
      .fontSize(14)
      .text(`Total Sales Count: ${totalSalesCount}`, { align: "right" });
    doc.text(`Total Order Amount: ${totalOrderAmount.toFixed(2)}`, {
      align: "right",
    });
    doc.moveDown();

    const tableTop = 220;
    const itemSpacing = 25;
    const headerDataGap = 15;
    doc
      .fontSize(12)
      .text("Order ID", 50, tableTop, { width: 150 })
      .text("Date", 200, tableTop, { width: 100 })
      .text("Username", 300, tableTop, { width: 100 })
      .text("Product Name", 380, tableTop, { width: 150 })
      .text("Quantity", 520, tableTop, { width: 80 })
      .text("Price", 595, tableTop, { width: 80 })
      .text("Payment Method", 665, tableTop, { width: 120 });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(760, tableTop + 15)
      .stroke();

    let rowY = tableTop + 20 + headerDataGap;
    const pageHeightLimit = 1020;

    if (orders.length > 0) {
      orders.forEach((order) => {
        order.items.forEach((item) => {
          doc
            .fontSize(10)
            .text(`${order._id}`, 50, rowY, { width: 150 })
            .text(`${order.orderedDate.toDateString()}`, 200, rowY, {
              width: 100,
            })
            .text(`${order.deliveryAddress.name}`, 300, rowY, { width: 100 })
            .text(`${item.productName}`, 380, rowY, { width: 175 })
            .text(`${item.quantity}`, 540, rowY, { width: 80 })
            .text(`${item.discountedPrice.toFixed(2)}`, 590, rowY, {
              width: 80,
            })
            .text(`${order.paymentMethod}`, 665, rowY, { width: 120 });

          rowY += itemSpacing;

          if (rowY >= pageHeightLimit) {
            doc.addPage();
            rowY = 50;
          }
        });
      });
    } else {
      doc
        .fontSize(12)
        .text("No orders found for the selected filters.", 200, rowY);
    }

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const download_Excel = async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.orderedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (filter) {
      const today = new Date();
      if (filter === "daily") {
        query.orderedDate = {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else if (filter === "weekly") {
        const firstDayOfWeek = today.getDate() - today.getDay();
        const start = new Date(today.setDate(firstDayOfWeek));
        start.setHours(0, 0, 0, 0);
        query.orderedDate = {
          $gte: start,
          $lte: new Date(today.setDate(start.getDate() + 6)).setHours(
            23,
            59,
            59,
            999
          ),
        };
      } else if (filter === "monthly") {
        query.orderedDate = {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lte: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          ),
        };
      }
    }

    const orders = await orderDB.find(query).populate("userId", "username");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Order ID", key: "orderId", width: 30 },
      { header: "Username", key: "username", width: 15 },
      { header: "Product Name", key: "productName", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "Price", key: "price", width: 10 },
      { header: "Quantity", key: "quantity", width: 10 },
    ];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        worksheet.addRow({
          date: order.orderedDate.toDateString(),
          orderId: order._id,
          username: order.deliveryAddress.name,
          productName: item.productName,
          address: `${order.deliveryAddress.address}, ${order.deliveryAddress.locality}, ${order.deliveryAddress.district}`,
          price: `₹${item.discountedPrice.toFixed(2)}`,
          quantity: item.quantity,
        });
      });
    });

    const filename = `Sales_Report_${new Date().toISOString()}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).send("Error generating Excel");
  }
};

module.exports = {
  getOrder,
  update_OrderStatus,
  getReport,
  download_Pdf,
  download_Excel,
};
