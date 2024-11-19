const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const WalletDB = require("../../models/wallet");
const pdf = require("html-pdf");
const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const userOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const orders = await orderDB
      .find({ userId: req.user._id })
      .populate({
        path: "items.productId",
        select: "productName productImage",
      })
      .sort({ orderedDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalOrders = await orderDB.countDocuments({ userId: req.user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    const updatedOrders = orders.map((order) => {
      let totalAmount = 0;
      let deliveryCharge = 50;

      order.items = order.items.map((item) => {
        const discountedPrice = item.discountedPrice;
        const itemTotal = discountedPrice * item.quantity;
        totalAmount += itemTotal;

        return {
          ...item.toObject(),
          itemTotal: itemTotal,
        };
      });

      if (totalAmount > 1000) {
        deliveryCharge = 0;
      }

      const finalAmount = totalAmount + deliveryCharge;

      return {
        ...order.toObject(),
        totalAmount: finalAmount,
        deliveryCharge: deliveryCharge,
      };
    });

    res.render("user/orders", {
      user: req.user,
      isLoggedIn: true,
      orders: updatedOrders,
      pageName: "orders",
      currentPage: page,
      totalPages: totalPages,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await orderDB.findById(orderId).populate({
      path: "items.productId",
      select: "productName productImage category",
    });

    let totalAmount = 0;
    let deliveryCharge = 50;

    order.items = order.items.map((item) => {
      const discountedPrice = item.discountedPrice;
      const itemTotal = discountedPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        ...item.toObject(),
        itemTotal: itemTotal,
      };
    });

    if (totalAmount > 1000) {
      deliveryCharge = 0;
    }

    const finalAmount = totalAmount + deliveryCharge;

    res.render("user/order_details", {
      user: req.user,
      isLoggedIn: true,
      order: {
        ...order.toObject(),
        totalAmount: finalAmount,
        deliveryCharge: deliveryCharge,
      },
      pageName: "order_details",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderDB.findById(orderId).populate({
      path: "items.productId",
      select: "productName productImage category",
      populate: {
        path: "category",
        select: "categoryName discount",
      },
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    let calculatedTotalAmount = 0;
    order.items.forEach((item) => {
      calculatedTotalAmount += item.discountedPrice * item.quantity;
    });

    const deliveryCharge = calculatedTotalAmount < 1000 ? 50 : 0;
    const finalTotalAmount = calculatedTotalAmount + deliveryCharge;

    const html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header, .footer { text-align: center; font-size: 12px; color: #777; }
          .invoice-header { display: flex; justify-content: space-between; align-items: center; }
          .invoice-header h1 { font-size: 24px; color: #3498db; }
          .invoice-header .invoice-details { text-align: right; font-size: 14px; color: #666; }
          .section { margin: 20px 0; }
          .section h2 { font-size: 16px; color: #3498db; margin-bottom: 10px; }
          .section p { margin: 5px 0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th, .table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
          .table th { background-color: #3498db; color: #fff; }
          .total { font-weight: bold; text-align: right; }
          .highlight { color: #3498db; font-weight: bold; }
          .footer {margin-top: 200px}
          .footer p { font-size: 10px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Orbit</h2>
            <p>Aquarium Corner<br>
              Aqua Street, Nedumangad, Trivandrum<br>
              www.orbit.com</p>
          </div>

          <div class="invoice-header">
            <h1>Invoice</h1>
            <div class="invoice-details">
              <p>Receipt #<span class="highlight">${orderId}</span></p>
              <p>${new Date(order.orderedDate).toDateString()}</p>
            </div>
          </div>

          <div class="section">
            <h2>Invoice to:</h2>
            <p>Name: ${order.deliveryAddress.name}</p>
            <p>Address: ${order.deliveryAddress.address}, ${
      order.deliveryAddress.locality
    }, ${order.deliveryAddress.district}, ${order.deliveryAddress.state}, ${
      order.deliveryAddress.pincode
    }</p>
            <p>Phone: ${order.deliveryAddress.mobileNumber}</p>
          </div>

          <div class="section">
            <h2>Order Summary</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Menu</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.productName}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="total">Discounted Price</td>
                  <td>₹${calculatedTotalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="total">Delivery Charge</td>
                  <td>₹${deliveryCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="total highlight">Total</td>
                  <td>₹${finalTotalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="section">
            <h2>Payment Method</h2>
            <p>${order.paymentMethod}</p>
          </div>

          <div class="section">
            <h2>Terms and Conditions Apply</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum lorem odio.</p>
            <p><strong>Additional Notes</strong>: Lorem Ipsum is simply dummy text of the printing and typesetting industry.
             Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
             when an unknown printer took a galley of type and scrambled
             it to make a type specimen book.</p>
          </div>

          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Aquarium Corner<br>Aqua Street, Nedumangad, Trivandrum<br>www.orbit.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    pdf.create(html).toStream((err, stream) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${orderId}.pdf"`
      );
      stream.pipe(res);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const returnOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { returnReason } = req.body;

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

    item.status = "Processing";
    order.paymentStatus = "Processing";
    item.returnReason = returnReason;
    await order.save();

    return res.json({
      success: true,
      message:
        "Return process initiated. Order status set to 'Processing'. Refund will be processed soon.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { cancelReason } = req.body;

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

    const refundAmount = item.discountedPrice * item.quantity;

    await productDB.findByIdAndUpdate(item.productId._id, {
      $inc: { stock: item.quantity },
    });

    item.status = "Cancelled";
    item.cancelReason = cancelReason;
    order.status = "Cancelled";
    await order.save();

    const wallet = await WalletDB.findOne({ user: req.user._id });
    if (order.paymentMethod !== "Cash on Delivery") {
      if (!wallet) {
        const newWallet = new WalletDB({
          user: req.user._id,
          balance: refundAmount,
          transactions: [
            {
              type: "Credit",
              amount: refundAmount,
              description: `Refund for cancelling product: ${item.productName}`,
              timestamp: new Date(),
            },
          ],
        });
        await newWallet.save();
        return res.json({
          success: true,
          message: "Order has been canceled successfully.",
          newBalance: newWallet.balance,
        });
      } else {
        wallet.balance += refundAmount;
        wallet.transactions.push({
          type: "Credit",
          amount: refundAmount,
          description: `Refund for cancelling product: ${item.productName}`,
          timestamp: new Date(),
        });
        await wallet.save();
        return res.json({
          success: true,
          message: "Order has been canceled successfully.",
          newBalance: wallet.balance,
        });
      }
    }

    return res.json({
      success: true,
      message: "Order has been canceled successfully.",
      newBalance: wallet ? wallet.balance : 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderDB.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    let totalAmount = 0;
    let deliveryCharge = 50;

    order.items.forEach((item) => {
      const discountedPrice = item.discountedPrice;
      const itemTotal = discountedPrice * item.quantity;
      totalAmount += itemTotal;
    });

    if (totalAmount > 1000) {
      deliveryCharge = 0;
    }

    const finalAmount = totalAmount + deliveryCharge;
    const amountInPaise = Math.round(finalAmount * 100);

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId,
    });

    res.json({ orderId: razorpayOrder.id, amount: finalAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderDB.findByIdAndUpdate(
      orderId,
      { paymentStatus: "Completed" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, message: "Payment successful" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update payment status" });
  }
};

module.exports = {
  userOrders,
  orderDetails,
  downloadInvoice,
  returnOrder,
  cancelOrder,
  retryPayment,
  paymentSuccess,
};
