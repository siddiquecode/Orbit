const orderDB = require("../../models/order");
const userDB = require("../../models/user");

const getLogin = (req, res) => {
  try {
    if (req.session.adminLoggedIn) {
      res.redirect("/admin/getdashboard");
    } else {
      res.render("admin/login", { errorMessage: req.flash("error") });
    }
  } catch (error) {
    console.log(error);
  }
};

const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (
      process.env.ADMIN_EMAIL == email &&
      process.env.ADMIN_PASSWORD == password
    ) {
      req.session.adminLoggedIn = true;
      res.redirect("/admin/getdashboard");
    } else {
      req.flash("error", "Invalid Email of Password");
      return res.redirect("/admin");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const getDashboard = async (req, res) => {
  try {
    const totalOrders = await orderDB.countDocuments();

    const pendingOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Pending" } },
      { $count: "pendingOrders" },
    ]);

    const processingOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Processing" } },
      { $count: "processingOrders" },
    ]);

    const shippedOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Shipped" } },
      { $count: "shippedOrders" },
    ]);

    const deliveredOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      { $count: "deliveredOrders" },
    ]);

    const cancelledOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Cancelled" } },
      { $count: "cancelledOrders" },
    ]);

    const returnedOrders = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Returned" } },
      { $count: "returnedOrders" },
    ]);

    const todaySales = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const weeklySales = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const lastMonthSales = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const allTimeSales = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const bestSellingProducts = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const bestSellingCategories = await orderDB.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      {
        $group: {
          _id: "$items.categoryName",
          totalCategorySales: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalCategorySales: -1 } },
      { $limit: 5 },
    ]);

    const dailySalesData = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$orderedDate" },
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklySalesData = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: { $week: "$orderedDate" },
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlySalesData = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          orderedDate: {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: { $month: "$orderedDate" },
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlySalesDataFormatted = Array(12)
      .fill(0)
      .map((_, index) => ({
        month: index + 1,
        total: 0,
      }));

    monthlySalesData.forEach(({ _id, total }) => {
      monthlySalesDataFormatted[_id - 1].total = total;
    });

    const yearlySalesData = await orderDB.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.status": "Delivered",
        },
      },
      {
        $group: {
          _id: { $year: "$orderedDate" },
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const yearlySalesDataFormatted = yearlySalesData.map(({ _id, total }) => ({
      year: _id,
      total,
    }));

    res.render("admin/dashboard", {
      totalOrders,
      pendingOrders: pendingOrders[0]?.pendingOrders || 0,
      processingOrders: processingOrders[0]?.processingOrders || 0,
      shippedOrders: shippedOrders[0]?.shippedOrders || 0,
      deliveredOrders: deliveredOrders[0]?.deliveredOrders || 0,
      cancelledOrders: cancelledOrders[0]?.cancelledOrders || 0,
      returnedOrders: returnedOrders[0]?.returnedOrders || 0,
      todaySales: todaySales[0]?.total || 0,
      weeklySales: weeklySales[0]?.total || 0,
      lastMonthSales: lastMonthSales[0]?.total || 0,
      allTimeSales: allTimeSales[0]?.total || 0,
      bestSellingProducts,
      bestSellingCategories,
      dailySalesData,
      weeklySalesData,
      monthlySalesData: monthlySalesDataFormatted,
      yearlySalesData: yearlySalesDataFormatted,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const logout = (req, res) => {
  try {
    req.session.adminLoggedIn = false;
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page || 1);

    const totalUsers = await userDB.countDocuments();

    const user = await userDB
      .find()
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    res.render("admin/users", {
      user,
      currentPage: page,
      totalPages,
      itemsPerPage,
    });
  } catch (error) {
    console.log(error);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await userDB.findByIdAndUpdate(userId, { isBlocked: true });
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to block user" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await userDB.findByIdAndUpdate(userId, { isBlocked: false });
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

module.exports = {
  getLogin,
  postLogin,
  getDashboard,
  logout,
  getUser,
  blockUser,
  unblockUser,
};
