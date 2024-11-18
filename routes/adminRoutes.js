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
adminRouter.get(
  "/Addcategory",
  adminAuthenticated,
  categoryController.Addcategory_get
);
adminRouter.post(
  "/Addcategory",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 1),
  categoryController.Addcategory
);
adminRouter.get(
  "/Editcategory/:id",
  adminAuthenticated,
  categoryController.Editcategory_get
);
adminRouter.post(
  "/Editcategory/:id",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 1),
  categoryController.Editcategory
);
adminRouter.post("/blockcategory/:id", categoryController.blockcategory);
adminRouter.post("/unblockcategory/:id", categoryController.unblockcategory);

// .................... product
adminRouter.get(
  "/getproduct",
  adminAuthenticated,
  productController.getproduct
);
adminRouter.get(
  "/Addproduct",
  adminAuthenticated,
  productController.Addproduct_get
);
adminRouter.post(
  "/Addproduct",
  adminAuthenticated,
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 3),
  productController.Addproduct
);
adminRouter.get(
  "/Editproduct/:id",
  adminAuthenticated,
  productController.Editproduct_get
);
adminRouter.post(
  "/Editproduct/:id",
  adminAuthenticated,
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 3),
  productController.Editproduct
);
adminRouter.post("/blockproduct/:id", productController.blockproduct);
adminRouter.post("/unblockproduct/:id", productController.unblockproduct);

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
adminRouter.put(
  "/editcoupon/:id",
  adminAuthenticated,
  couponController.editcoupon
);
adminRouter.delete(
  "/deletecoupon/:id",
  adminAuthenticated,
  couponController.deletecoupon
);

// .................... order
adminRouter.get("/getorder", adminAuthenticated, orderController.getorder);
adminRouter.patch(
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
adminRouter.put(
  "/editoffer/:id",
  adminAuthenticated,
  offerController.editoffer
);
adminRouter.delete(
  "/deleteoffer/:id",
  adminAuthenticated,
  offerController.deleteoffer
);

module.exports = adminRouter;
