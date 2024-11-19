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
adminRouter.get("/", adminController.getLogin);
adminRouter.post("/", adminController.postLogin);
adminRouter.get(
  "/getdashboard",
  adminAuthenticated,
  adminController.getDashboard
);
adminRouter.post("/logout", adminController.logout);

// .................... user
adminRouter.get("/users", adminAuthenticated, adminController.getUser);
adminRouter.patch("/users/:id/block", adminController.blockUser);
adminRouter.patch("/users/:id/unblock", adminController.unblockUser);

// .................... category
adminRouter.get(
  "/getcategory",
  adminAuthenticated,
  categoryController.getCategory
);
adminRouter.get(
  "/Addcategory",
  adminAuthenticated,
  categoryController.addCategory_Get
);
adminRouter.post(
  "/Addcategory",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 1),
  categoryController.addCategory_Post
);
adminRouter.get(
  "/Editcategory/:id",
  adminAuthenticated,
  categoryController.editCategory_Get
);
adminRouter.post(
  "/Editcategory/:id",
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 1),
  categoryController.editCategory_Post
);
adminRouter.post("/blockcategory/:id", categoryController.blockCategory);
adminRouter.post("/unblockcategory/:id", categoryController.unblockCategory);

// .................... product
adminRouter.get(
  "/getproduct",
  adminAuthenticated,
  productController.getProduct
);
adminRouter.get(
  "/Addproduct",
  adminAuthenticated,
  productController.addProduct_Get
);
adminRouter.post(
  "/Addproduct",
  adminAuthenticated,
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 3),
  productController.addProduct_Post
);
adminRouter.get(
  "/Editproduct/:id",
  adminAuthenticated,
  productController.editProduct_Get
);
adminRouter.post(
  "/Editproduct/:id",
  adminAuthenticated,
  multer({ storage: fileStorage, fileFilter: fileFilter }).array("image", 3),
  productController.editProduct_Post
);
adminRouter.post("/blockproduct/:id", productController.blockProduct);
adminRouter.post("/unblockproduct/:id", productController.unblockProduct);

// .................... coupon
adminRouter.get("/getcoupon", adminAuthenticated, couponController.getCoupon);
adminRouter.get(
  "/addcoupon",
  adminAuthenticated,
  couponController.addCoupon_Get
);
adminRouter.post("/addcoupon", adminAuthenticated, couponController.addCoupon_Post);
adminRouter.get(
  "/editcoupon/:id",
  adminAuthenticated,
  couponController.editCoupon_Get
);
adminRouter.put(
  "/editcoupon/:id",
  adminAuthenticated,
  couponController.editCoupon_Post
);
adminRouter.delete(
  "/deletecoupon/:id",
  adminAuthenticated,
  couponController.deleteCoupon
);

// .................... order
adminRouter.get("/getorder", adminAuthenticated, orderController.getOrder);
adminRouter.patch(
  "/updateOrderStatus/:orderId/:productId",
  orderController.update_OrderStatus
);

// .................... sales report
adminRouter.get("/getreport", adminAuthenticated, orderController.getReport);
adminRouter.get(
  "/downloadPDF",
  adminAuthenticated,
  orderController.download_Pdf
);
adminRouter.get(
  "/downloadEXCEL",
  adminAuthenticated,
  orderController.download_Excel
);

// .................... offer module
adminRouter.get("/getoffer", adminAuthenticated, offerController.getOffer);
adminRouter.get("/addoffer", adminAuthenticated, offerController.addOffer_Get);
adminRouter.post("/addoffer", adminAuthenticated, offerController.addOffer_Post);
adminRouter.get("/getOptions", adminAuthenticated, offerController.getOptions);
adminRouter.get(
  "/editoffer/:id",
  adminAuthenticated,
  offerController.editOffer_Get
);
adminRouter.put(
  "/editoffer/:id",
  adminAuthenticated,
  offerController.editOffer_Post
);
adminRouter.delete(
  "/deleteoffer/:id",
  adminAuthenticated,
  offerController.deleteOffer
);

module.exports = adminRouter;
