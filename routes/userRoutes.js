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
router.get("/productlist/:page?", homecontroller.productList);
router.get(
  "/productdetails/:id",
  userAuthenticated,
  homecontroller.productDetails
);
router.get("/products/:categoryId", homecontroller.categories);
router.post("/userlogout", homecontroller.logout);

// ....................signup
router.get("/usersignup", signupcontroller.signup_Get);
router.post("/usersignup", signupcontroller.signup_Post);
router.get("/otp", signupcontroller.otp_Get);
router.post("/postotp", signupcontroller.otp_Post);
router.post("/resentOtp", signupcontroller.resentOtp);
router.get("/userlogin", signupcontroller.login_Get);
router.post("/userlogin", signupcontroller.login_Post);

//  .................... forgot password
router.get("/forgot", forgotANDresetcontroller.forgot_Get);
router.post("/forgot", forgotANDresetcontroller.forgot_Post);
router.get("/forgototp", forgotANDresetcontroller.forgotOtp_Get);
router.post("/forgototpPost", forgotANDresetcontroller.forgotOtp_Post);
router.get("/resetpassword", forgotANDresetcontroller.resetPassword_Get);
router.post("/resetpasswordpost", forgotANDresetcontroller.resetPassword_Post);
router.post("/forgotresentOtp", forgotANDresetcontroller.forgotResentOtp);

//  .................... profile
router.get("/userprofile", userAuthenticated, profilecontroller.userProfile);
router.get(
  "/userprofile/edit",
  userAuthenticated,
  profilecontroller.editProfile_Get
);
router.post(
  "/editprofile/:id",
  userAuthenticated,
  profilecontroller.editProfile_Post
);
router.get(
  "/changepassword",
  userAuthenticated,
  profilecontroller.changePassword_Get
);
router.post(
  "/changepassword",
  userAuthenticated,
  profilecontroller.changePassword_Post
);

//  .................... address
router.get("/useraddress", userAuthenticated, Addresscontroller.userAddress);
router.get("/Addaddress", userAuthenticated, Addresscontroller.addAddress_Get);
router.post("/Addaddress", userAuthenticated, Addresscontroller.addAddress_Post);
router.get(
  "/updateAddress/:id",
  userAuthenticated,
  Addresscontroller.editAddress_Get
);
router.post(
  "/updateAddress/:id",
  userAuthenticated,
  Addresscontroller.editAddress_Post
);
router.delete(
  "/useraddress/:id",
  userAuthenticated,
  Addresscontroller.deleteAddress
);

//  .................... checkout
router.get("/checkout", userAuthenticated, checkoutcontroller.userCheckout);
router.get(
  "/AddCheckoutAddress",
  userAuthenticated,
  checkoutcontroller.checkoutAddress_Get
);
router.post(
  "/AddCheckoutAddress",
  userAuthenticated,
  checkoutcontroller.checkoutAddress_Post
);
router.get(
  "/checkoutAddress/:id",
  userAuthenticated,
  checkoutcontroller.editCheckoutAddress_Get
);
router.post(
  "/checkoutAddress/:id",
  userAuthenticated,
  checkoutcontroller.editCheckoutAddress_Post
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
router.get("/userorders", userAuthenticated, ordercontroller.userOrders);
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
router.get("/cart", userAuthenticated, cartcontroller.userCart);
router.post("/cart/:id", userAuthenticated, cartcontroller.addToCart);
router.post(
  "/updatecart/:id",
  userAuthenticated,
  cartcontroller.updateQuantity
);
router.get("/removeitem/:id", userAuthenticated, cartcontroller.removeItem);

//  .................... wishlist
router.get("/userwishlist", userAuthenticated, wishlistcontroller.userWishlist);
router.post(
  "/wishlist/:id",
  userAuthenticated,
  wishlistcontroller.addToWishlist
);
router.delete(
  "/removewishlist/:id",
  userAuthenticated,
  wishlistcontroller.removeWishlist
);
router.post(
  "/WishlistToCart/:id",
  userAuthenticated,
  wishlistcontroller.goToCart
);

//  .................... wallet
router.get("/userwallet", userAuthenticated, wishlistcontroller.userWallet);

//  .................... coupon
router.get("/usercoupon", userAuthenticated, couponcontroller.userCoupon);
router.patch("/applyCoupon", userAuthenticated, couponcontroller.applyCoupon);
router.delete("/removeCoupon", userAuthenticated, couponcontroller.removeCoupon);

module.exports = router;
