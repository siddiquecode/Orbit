const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/admin_controller/adminCtrl");
const categoryController = require("../controller/admin_controller/categoryCtrl");
const productController = require("../controller/admin_controller/productCtrl");
const orderController = require("../controller/admin_controller/orderCtrl");
const couponController = require("../controller/admin_controller/couponCtrl");
const offerController = require("../controller/admin_controller/offerCtrl");
const { adminAuthenticated } = require("../middleware/adminAuth");
const multer = require("multer");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jfif" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// .................... login & signup
adminRouter.get("/", adminController.getlogin);
adminRouter.post("/", adminController.postlogin);
adminRouter.get(
  "/getdashboard",
  adminAuthenticated,
  adminController.getdashboard
);
adminRouter.post("/logout", adminController.logout);

// .................... user
adminRouter.get("/users", adminAuthenticated, adminController.getuser);
adminRouter.patch("/users/:id/block", adminController.blockuser);
adminRouter.patch("/users/:id/unblock", adminController.unblockuser);

// .................... category
adminRouter.get(
  "/getcategory",
  adminAuthenticated,
  categoryController.getcategory
);
adminRouter.post(
  "/addcategory",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 1),
  categoryController.addcategory
);
adminRouter.post(
  "/editcategory/:id",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array(
    "categoryImage",
    1
  ),
  categoryController.editcategory
);
adminRouter.patch("/categories/:id/block", categoryController.blockcategory);
adminRouter.patch(
  "/categories/:id/unblock",
  categoryController.unblockcategory
);

// .................... product
adminRouter.get(
  "/getproduct",
  adminAuthenticated,
  productController.getproduct
);
adminRouter.post(
  "/addproduct",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 3),
  productController.addproduct
);
adminRouter.put(
  "/editproduct/:id",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array(
    "productImage",
    3
  ),
  productController.editproduct
);
adminRouter.post("/blockproduct/:id", productController.blockproduct);
adminRouter.post("/unblockproduct/:id", productController.unblockproduct);
adminRouter.post("/deleteproduct/:id", productController.deleteproduct);

// .................... coupon
adminRouter.get("/getcoupon", adminAuthenticated, couponController.getcoupon);
adminRouter.get(
  "/addcoupon",
  adminAuthenticated,
  couponController.get_addcoupon
);
adminRouter.post("/addcoupon", adminAuthenticated, couponController.addcoupon);
adminRouter.get(
  "/editcoupon/:id",
  adminAuthenticated,
  couponController.get_editcoupon
);
adminRouter.post(
  "/editcoupon/:id",
  adminAuthenticated,
  couponController.editcoupon
);
adminRouter.get(
  "/deletecoupon/:id",
  adminAuthenticated,
  couponController.deletecoupon
);

// .................... order
adminRouter.get("/getorder", adminAuthenticated, orderController.getorder);
adminRouter.post(
  "/updateOrderStatus/:orderId/:productId",
  orderController.update_OrderStatus
);

// .................... sales report
adminRouter.get("/getreport", adminAuthenticated, orderController.getreport);
adminRouter.get(
  "/downloadPDF",
  adminAuthenticated,
  orderController.download_pdf
);
adminRouter.get(
  "/downloadEXCEL",
  adminAuthenticated,
  orderController.download_excel
);

// .................... offer module
adminRouter.get("/getoffer", adminAuthenticated, offerController.getoffer);
adminRouter.get("/addoffer", adminAuthenticated, offerController.addoffer_get);
adminRouter.post("/addoffer", adminAuthenticated, offerController.addoffer);
adminRouter.get("/getOptions", adminAuthenticated, offerController.getOptions);
adminRouter.get(
  "/editoffer/:id",
  adminAuthenticated,
  offerController.editoffer_get
);
adminRouter.post(
  "/editoffer/:id",
  adminAuthenticated,
  offerController.editoffer
);
adminRouter.get(
  "/deleteoffer/:id",
  adminAuthenticated,
  offerController.deleteoffer
);

module.exports = adminRouter;
