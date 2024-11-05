const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");
const offerDB = require("../../models/offer");
const mailSender = require("../../config/mailer");
const { totp } = require("otplib");
const bcrypt = require("bcrypt");
const saltRounds = 10;

function checkSignUpError(data) {
  const namePattern = /^\S+\s+\S+$/;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  let error = false,
    message = "";
  if (!data.firstname) {
    error = true;
    message = "Please enter firstname to continue";
  } else if (data.firstname.trim() !== data.firstname) {
    error = true;
    message = "Please enter a valid firstname without spaces before and after";
  } else if (namePattern.test(data.firstname)) {
    error = true;
    message = "Please enter a valid firstname without space in the middle";
  } else if (!data.lastname) {
    error = true;
    message = "Please enter lastname";
  } else if (data.lastname.trim() !== data.lastname) {
    error = true;
    message = "Please enter a valid lastname without spaces before and after";
  } else if (namePattern.test(data.lastname)) {
    error = true;
    message = "Please enter a valid lastname without space in the middle";
  } else if (!data.email) {
    error = true;
    message = "Please enter email";
  } else if (!emailPattern.test(data.email)) {
    error = true;
    message = "Email should not contain spaces";
  } else if (!data.password) {
    error = true;
    message = "Please enter password";
  } else if (!passwordPattern.test(data.password)) {
    error = true;
    message =
      "Password must be at least 8 characters long and include both letters and numbers";
  }
  if (error) {
    return {
      error: true,
      message: message,
    };
  } else {
    return {
      error: false,
    };
  }
}

const signup = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    }
    res.render("user/signup", { errorMessage: req.flash("error") });
  } catch (error) {
    console.log(error);
  }
};

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const signuppost = async (req, res) => {
  try {
    const { firstname, lastname, email, password, referrelcode } = req.body;

    const data = { firstname, lastname, email, password };

    const checkResult = checkSignUpError(data);
    if (checkResult.error) {
      req.flash("error", checkResult.message);
      return res.redirect("/usersignup");
    }

    const existingUser = await userDB.findOne({ email });
    if (existingUser) {
      if (!existingUser.password) {
        req.flash(
          "error",
          "This email is registered with Google. Please use oogle login."
        );
        return res.redirect("/userlogin");
      } else {
        req.flash("error", "User already exists. Please login.");
        return res.redirect("/userlogin");
      }
    }

    let referrer;
    let activeOffer;

    if (referrelcode) {
      referrer = await userDB.findOne({ referralCode: referrelcode });

      if (!referrer) {
        req.flash("error", "Invalid referral code.");
        return res.redirect("/usersignup");
      }

      activeOffer = await offerDB.findOne({
        offerType: "Signup Referral Offer",
        status: "Active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (!activeOffer) {
        req.flash("error", "No active Signup Referral offer.");
        return res.redirect("/usersignup");
      }

      req.session.referralCode = referrelcode;
      req.session.referrer = referrer;
      req.session.activeOffer = activeOffer;
    }

    const referralCode = generateReferralCode();

    data.password = await bcrypt.hash(password, saltRounds);

    req.session.credential = {
      firstname,
      lastname,
      email,
      password: data.password,
      referralCode,
    };

    const secret = process.env.OTP_SECRET;
    const token = totp.generate(secret);
    console.log("Stored OTP:", token);
    const mailBody = `Your registration OTP is ${token}`;
    await mailSender(email, "Registration OTP", mailBody);

    req.session.otp = token;

    res.redirect("/otp");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getotp = async (req, res) => {
  try {
    res.render("user/otp", { errorMessage: req.flash("error") });
  } catch (error) {
    console.log(error);
  }
};

const postotp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("entered OTP ", otp);

    const storedOtp = req.session.otp;

    if (!storedOtp) {
      return res.status(400).send("Session expired or invalid");
    }

    if (otp === storedOtp) {
      let user = req.session.credential;

      const newUser = await userDB.create({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        password: user.password,
        referralCode: user.referralCode,
      });

      await WalletDB.create({
        user: newUser._id,
        balance: 0,
        transactions: [],
      });

      await wishlistDB.create({
        user: newUser._id,
        items: [],
      });

      const { referralCode } = req.session;
      const referrer = req.session.referrer;
      const activeOffer = req.session.activeOffer;

      if (referralCode && activeOffer) {
        await WalletDB.findOneAndUpdate(
          { user: referrer._id },
          {
            $inc: { balance: activeOffer.referrerCredit },
            $push: {
              transactions: {
                type: "Credit",
                amount: activeOffer.referrerCredit,
                description: `Referral bonus for referring ${user.firstname} ${user.lastname} (Offer: ${activeOffer.offerName})`,
              },
            },
          }
        );

        await WalletDB.findOneAndUpdate(
          { user: newUser._id },
          {
            $inc: { balance: activeOffer.refereeCredit },
            $push: {
              transactions: {
                type: "Credit",
                amount: activeOffer.refereeCredit,
                description: `Referral bonus for using a referral code (Offer: ${activeOffer.offerName})`,
              },
            },
          }
        );
      }

      req.session.otp = null;
      req.session.credential = null;
      req.session.referralCode = null;
      req.session.referrer = null;
      req.session.activeOffer = null;

      return res.redirect("/userlogin");
    } else {
      return res.status(400).send("Invalid OTP");
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("An error occurred");
  }
};

const resentOtp = async (req, res) => {
  try {
    const user = req.session.credential;

    if (!user.email) {
      return res.status(400).send("session expried or invalid");
    }

    const email = user.email;
    console.log("post resend otp hits");
    const secret = process.env.OTP_SECRET;
    const token = totp.generate(secret);
    console.log("resent OTP:", token);
    const mailBody = `Your registration otp is ${token}`;
    await mailSender(email, "Registration OTP", mailBody);
    req.session.otp = token;

    res.redirect("/otp");
  } catch (error) {
    console.log(error);
  }
};

const login = async (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  } else {
    res.render("user/login", {
      errorMessage: req.flash("error"),
      successMessage: req.flash("success"),
    });
  }
};

const loginpost = async (req, res) => {
  try {
    const user = await userDB.findOne({ email: req.body.email });

    if (!user) {
      req.flash("error", "Enter your email and password");
      return res.redirect("/userlogin");
    }

    if (!user.password) {
      req.flash(
        "error",
        "This email is registered with Google. Please use Google login."
      );
      return res.redirect("/userlogin");
    }

    if (user.isBlocked) {
      req.flash("error", "Your account is blocked");
      return res.redirect("/userlogin");
    }

    if (!req.body.password) {
      req.flash("error", "Please enter your password");
      return res.redirect("/userlogin");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (isMatch) {
      req.session.user = req.body.email;
      res.redirect("/");
    } else {
      req.flash("error", "Password is incorrect");
      return res.redirect("/userlogin");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/userlogin");
  }
};

module.exports = {
  signup,
  signuppost,
  getotp,
  postotp,
  resentOtp,
  login,
  loginpost,
};
