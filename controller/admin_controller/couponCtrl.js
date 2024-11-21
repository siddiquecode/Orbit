const couponDB = require("../../models/coupon");

const getCoupon = async (req, res) => {
  try {
    const coupons = await couponDB.find({});
    res.render("admin/coupon", {
      coupons,
    });
  } catch (error) {
    console.log(error);
  }
};

const addCoupon_Get = async (req, res) => {
  try {
    res.render("admin/add_coupon");
  } catch (error) {
    console.log(error);
  }
};

const addCoupon_Post = async (req, res) => {
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

const editCoupon_Get = async (req, res) => {
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

const editCoupon_Post = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { couponCode, discount, minimumAmount, maximumAmount, expireDate } =
      req.body;

    await couponDB.findByIdAndUpdate(couponId, {
      couponCode,
      discount,
      minimumAmount,
      maximumAmount,
      expireDate,
    });

    res.redirect("/admin/getcoupon");
  } catch (error) {
    console.log(error);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await couponDB.findByIdAndDelete(couponId);
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
};

module.exports = {
  getCoupon,
  addCoupon_Get,
  addCoupon_Post,
  editCoupon_Get,
  editCoupon_Post,
  deleteCoupon,
};
