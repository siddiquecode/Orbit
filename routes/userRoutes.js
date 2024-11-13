const express = require("express");
const router = express.Router();
const passport = require("passport");
const homecontroller = require("../controller/user_controller/homeCtrl");
const signupcontroller = require("../controller/user_controller/signupCtrl");
const profilecontroller = require("../controller/user_controller/profileCtrl");
const cartcontroller = require("../controller/user_controller/cartCtrl");
const wishlistcontroller = require("../controller/user_controller/wishlistCtrl");
const checkoutcontroller = require("../controller/user_controller/checkoutCtrl");
const forgotANDresetcontroller = require("../controller/user_controller/forgot&resetCtrl");
const Addresscontroller = require("../controller/user_controller/addressCtrl");
const ordercontroller = require("../controller/user_controller/orderCtrl");
const couponcontroller = require("../controller/user_controller/couponCtrl");
const { userAuthenticated } = require("../middleware/userAuth");

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/userlogin" }),
  (req, res) => {
    req.session.user = req.user.email;
    res.redirect("/");
  }
);

// ....................home
router.get("/", homecontroller.home);
router.get("/search", homecontroller.searchCategory);
router.get("/productlist/:page?", homecontroller.productlist);
router.get(
  "/productdetails/:id",
  userAuthenticated,
  homecontroller.productdetails
);
router.get("/products/:categoryId", homecontroller.categories);
router.post("/userlogout", homecontroller.logout);

// ....................signup
router.get("/usersignup", signupcontroller.signup);
router.post("/usersignup", signupcontroller.signuppost);
router.get("/otp", signupcontroller.getotp);
router.post("/postotp", signupcontroller.postotp);
router.post("/resentOtp", signupcontroller.resentOtp);
router.get("/userlogin", signupcontroller.login);
router.post("/userlogin", signupcontroller.loginpost);

//  .................... forgot password
router.get("/forgot", forgotANDresetcontroller.forgot);
router.post("/forgot", forgotANDresetcontroller.forgotPost);
router.get("/forgototp", forgotANDresetcontroller.forgototp);
router.post("/forgototpPost", forgotANDresetcontroller.forgototpPost);
router.get("/resetpassword", forgotANDresetcontroller.resetpassword);
router.post("/resetpasswordpost", forgotANDresetcontroller.resetpasswordPost);
router.post("/forgotresentOtp", forgotANDresetcontroller.forgotresentOtp);

//  .................... profile
router.get("/userprofile", userAuthenticated, profilecontroller.userprofile);
router.get(
  "/userprofile/edit",
  userAuthenticated,
  profilecontroller.edit_getprofile
);
router.post(
  "/editprofile/:id",
  userAuthenticated,
  profilecontroller.editprofile
);
router.get(
  "/changepassword",
  userAuthenticated,
  profilecontroller.get_changepassword
);
router.post(
  "/changepassword",
  userAuthenticated,
  profilecontroller.changepassword
);

//  .................... address
router.get("/useraddress", userAuthenticated, Addresscontroller.useraddress);
router.get("/Addaddress", userAuthenticated, Addresscontroller.get_address);
router.post("/Addaddress", userAuthenticated, Addresscontroller.add_address);
router.get(
  "/updateAddress/:id",
  userAuthenticated,
  Addresscontroller.geteditAddress
);
router.post(
  "/updateAddress/:id",
  userAuthenticated,
  Addresscontroller.editaddress
);
router.delete(
  "/useraddress/:id",
  userAuthenticated,
  Addresscontroller.delete_address
);

//  .................... checkout
router.get("/checkout", userAuthenticated, checkoutcontroller.checkout_get);
router.get(
  "/AddCheckoutAddress",
  userAuthenticated,
  checkoutcontroller.get_checkoutAddress
);
router.post(
  "/AddCheckoutAddress",
  userAuthenticated,
  checkoutcontroller.add_checkoutAddress
);
router.get(
  "/checkoutAddress/:id",
  userAuthenticated,
  checkoutcontroller.editcheckout_address
);
router.post(
  "/checkoutAddress/:id",
  userAuthenticated,
  checkoutcontroller.update_address
);
router.post("/cod", userAuthenticated, checkoutcontroller.codController);
router.post(
  "/walletpay",
  userAuthenticated,
  checkoutcontroller.walletPayController
);
router.post(
  "/razorpay",
  userAuthenticated,
  checkoutcontroller.createRazorpayOrder
);
router.post(
  "/razorpay/verify",
  userAuthenticated,
  checkoutcontroller.verifyRazorpayPayment
);

//  .................... orders
router.get("/userorders", userAuthenticated, ordercontroller.userorders);
router.get(
  "/orderDetails/:id",
  userAuthenticated,
  ordercontroller.orderDetails
);
router.get(
  "/order/:id/download-invoice",
  userAuthenticated,
  ordercontroller.downloadInvoice
);
router.patch(
  "/returnOrder/:orderId/:productId",
  userAuthenticated,
  ordercontroller.returnOrder
);
router.patch(
  "/cancelOrder/:orderId/:productId",
  userAuthenticated,
  ordercontroller.cancelOrder
);
router.post("/retry-payment", userAuthenticated, ordercontroller.retryPayment);
router.post(
  "/payment-success",
  userAuthenticated,
  ordercontroller.paymentSuccess
);

//  .................... cart
router.get("/cart", userAuthenticated, cartcontroller.cart);
router.post("/cart/:id", userAuthenticated, cartcontroller.add_cart);
router.post(
  "/updatecart/:id",
  userAuthenticated,
  cartcontroller.update_quantity
);
router.get("/removeitem/:id", userAuthenticated, cartcontroller.remove_item);

//  .................... wishlist
router.get("/userwishlist", userAuthenticated, wishlistcontroller.userwishlist);
router.post(
  "/wishlist/:id",
  userAuthenticated,
  wishlistcontroller.add_wishlist
);
router.delete(
  "/removewishlist/:id",
  userAuthenticated,
  wishlistcontroller.remove_wishlist
);
router.post(
  "/WishlistToCart/:id",
  userAuthenticated,
  wishlistcontroller.go_to_cart
);

//  .................... wallet
router.get("/userwallet", userAuthenticated, wishlistcontroller.userwallet);

//  .................... coupon
router.get("/usercoupon", userAuthenticated, couponcontroller.usercoupon);
router.patch("/applyCoupon", userAuthenticated, couponcontroller.apply_coupon);
router.delete("/removeCoupon", userAuthenticated, couponcontroller.remove_coupon);

module.exports = router;
