const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");

const usercoupon = async (req, res) => {
  try {
    const coupons = await couponDB.find();

    res.render("user/coupon", {
      user: req.user,
      isLoggedIn: true,
      pageName: "coupon",
      coupons,
    });
  } catch (error) {
    console.log(error);
  }
};

const apply_coupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const cart = await cartDB.findOne({ user: user._id }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const coupon = await couponDB.findOne({
      couponCode: couponCode,
      expireDate: { $gt: new Date() },
      usedBy: { $ne: user._id },
    });

    if (!coupon) {
      return res
        .status(400)
        .json({
          message: "Coupon can be applied only once.",
        });
    }

    let subtotal = 0;
    let totalDiscountedPrice = 0;

    cart.items.forEach((item) => {
      const product = item.productId;
      const quantity = item.quantity;

      const discountedPrice = product.discountedPrice
        ? product.discountedPrice * quantity
        : product.price * quantity;

      subtotal += product.price * quantity;
      totalDiscountedPrice += discountedPrice;
    });

    if (subtotal < coupon.minimumAmount) {
      return res.status(400).json({
        message: `Minimum order amount for this coupon is ₹${coupon.minimumAmount}`,
      });
    }

    const couponDiscount = coupon.discount / 100;
    const couponAmount = totalDiscountedPrice * couponDiscount;

    const finalTotal =
      totalDiscountedPrice -
      couponAmount +
      (totalDiscountedPrice > 1000 ? 0 : 50);

    cart.totalDiscount = couponAmount;
    cart.balance = finalTotal;
    cart.couponApplied = true;
    cart.couponDiscountPercentage = coupon.discount;

    coupon.usedBy.push(user._id);
    await coupon.save();
    await cart.save();

    return res.status(200).json({
      message: "Coupon applied successfully",
      totalAmount: finalTotal,
      couponApplied: true,
      couponDiscountPercentage: coupon.discount,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while applying the coupon" });
  }
};

const remove_coupon = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const cart = await cartDB.findOne({ user: user._id });

    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    cart.couponApplied = false;
    cart.couponDiscountPercentage = 0;
    cart.totalDiscount = 0;
    cart.balance = cart.totalAmount;
    await cart.save();

    return res.status(200).json({
      message: "Coupon removed successfully",
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while removing the coupon" });
  }
};

module.exports = {
  usercoupon,
  apply_coupon,
  remove_coupon,
};
