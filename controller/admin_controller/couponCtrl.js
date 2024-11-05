const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");

const getcoupon = async (req, res) => {
  try {
    const coupons = await couponDB.find({});
    res.render("admin/coupon", {
      coupons,
    });
  } catch (error) {
    console.log(error);
  }
};

const get_addcoupon = async (req, res) => {
  try {
    res.render("admin/add_coupon");
  } catch (error) {
    console.log(error);
  }
};

const addcoupon = async (req, res) => {
  try {
    const { couponCode, discount, minimumAmount, maximumAmount, expireDate } =
      req.body;

    const newCoupon = new couponDB({
      couponCode,
      discount,
      minimumAmount,
      maximumAmount,
      expireDate,
    });

    await newCoupon.save();
    res.redirect("/admin/getcoupon");
  } catch (error) {
    console.log(error);
  }
};

const get_editcoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await couponDB.findById(couponId);

    res.render("admin/edit_coupon", {
      coupon,
    });
  } catch (error) {
    console.log(error);
  }
};

const editcoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { couponCode, discount, minimumAmount, maximumAmount, expireDate } =
      req.body;

    const updatedCoupon = await couponDB.findByIdAndUpdate(
      couponId,
      {
        couponCode,
        discount,
        minimumAmount,
        maximumAmount,
        expireDate,
      },
      { new: true }
    );

    res.redirect("/admin/getcoupon");
  } catch (error) {
    console.log(error);
  }
};

const deletecoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const deletedCoupon = await couponDB.findByIdAndDelete(couponId);

    res.redirect("/admin/getcoupon");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getcoupon,
  get_addcoupon,
  addcoupon,
  get_editcoupon,
  editcoupon,
  deletecoupon,
};
