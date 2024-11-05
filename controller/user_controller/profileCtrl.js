const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");
const { logout } = require("./homeCtrl");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const userprofile = async (req, res) => {
  try {
    res.render("user/profile", {
      user: req.user,
      isLoggedIn: true,
      pageName: "profile",
      successMessage: req.flash("success"),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const edit_getprofile = async (req, res) => {
  try {
    res.render("user/edit_profile", {
      user: req.user,
      isLoggedIn: true,
      pageName: "edit_profile",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const editprofile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId !== req.user._id.toString()) {
      return res.redirect("/userprofile");
    }

    const { firstname, lastname } = req.body;

    const updatedUser = await userDB.findByIdAndUpdate(
      userId,
      { firstname, lastname },
      { new: true }
    );

    req.session.user = updatedUser.email;

    req.flash("success", "Profile updated successfully.");
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error);
    req.flash(
      "error",
      "An error occurred while updating your profile. Please try again."
    );
    res.redirect("/userprofile");
  }
};

const get_changepassword = async (req, res) => {
  try {
    res.render("user/change_password", {
      user: req.user,
      isLoggedIn: true,
      pageName: "change_password",
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

const changepassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = req.user;

    if (!user.password) {
      req.flash(
        "error",
        "You are logged in with Google and cannot change your password."
      );
      return res.redirect("/changepassword");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash("error", "Current password is incorrect");
      return res.redirect("/changepassword");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match");
      return res.redirect("/changepassword");
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    req.flash("success", "Password changed successfully.");
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userprofile,
  edit_getprofile,
  editprofile,
  get_changepassword,
  changepassword,
};
