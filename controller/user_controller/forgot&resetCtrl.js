const userDB = require("../../models/user");
const mailSender = require("../../config/mailer");
const { totp } = require("otplib");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const forgot_Get = (req, res) => {
  if (req.session.user) {
    res.redirect("/forgototp");
  } else {
    res.render("user/forgetPage", { errorMessage: req.flash("error") });
  }
};

const forgot_Post = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      req.flash("error", "Enter your email");
      return res.redirect("/forgot");
    }

    req.session.credential = { email };
    const existinUser = await userDB.findOne({ email: email });

    if (existinUser) {
      if (existinUser.password === null) {
        req.flash(
          "error",
          "This email is registered with Google login. Please use Google login to access your account."
        );
        return res.redirect("/userlogin");
      }

      const secret = "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD";
      const token = totp.generate(secret);
      console.log("stored OTP:", token);
      const mailBody = `Your registration otp is ${token}`;
      await mailSender(email, "Registration OTP", mailBody);

      req.session.otp = token;
      console.log("mail send");
      res.redirect("/forgototp");
    } else {
      req.flash("error", "Mail id does not exist");
      return res.redirect("/forgot");
    }
  } catch (error) {
    console.log(error);
  }
};

const forgotOtp_Get = (req, res) => {
  try {
    res.render("user/forgotOTP", { errorMessage: req.flash("error") });
  } catch (error) {
    console.log(error);
  }
};

const forgotOtp_Post = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
    const enteredOtp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;
    console.log("entered OTP ", enteredOtp);

    const storedOtp = req.session.otp;

    if (!storedOtp) {
      req.flash("error", "session expired or invalid");
      return res.redirect("/forgototp");
    }

    if (enteredOtp === storedOtp) {
      const { email } = req.session.credential;

      const check = await userDB.findOne({ email });
      if (check) {
        req.session.checkOtp = true;
        res.redirect("/resetpassword");
      } else {
        req.flash("error", "User not found");
        return res.redirect("/forgototp");
      }
    } else {
      req.flash("error", "Invalid OTP");
      return res.redirect("/forgototp");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword_Get = (req, res) => {
  try {
    if (req.session.checkOtp) {
      res.render("user/resetPassword", { errorMessage: req.flash("error") });
    } else {
      res.redirect("/userlogin");
    }
  } catch (error) {
    console.log(error);
  }
};

const resetPassword_Post = async (req, res) => {
  try {
    if (!req.session.checkOtp) {
      return res.redirect("/userlogin");
    }
    const user = req.session.credential;

    if (!user) {
      req.flash("error", "User not found Please enter email");
      return res.redirect("/forgot");
    }
    if (!req.body.password) {
      req.flash("error", "Enter password");
      return res.redirect("/resetPassword");
    }
    if (!req.body.confirmpassword) {
      req.flash("error", "Enter Confirm Password");
      return res.redirect("/resetPassword");
    }
    if (req.body.password != req.body.confirmpassword) {
      req.flash("error", "Password do not match");
      return res.redirect("/resetPassword");
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    delete req.session.checkOtp;
    delete req.session.otp;
    req.flash(
      "success",
      `Password reset successfully.
                              Please log in.`
    );
    res.redirect("/userlogin");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
    res.redirect("/forgototp");
  }
};

const forgotResentOtp = async (req, res) => {
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

    res.redirect("/forgototp");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  forgot_Get,
  forgot_Post,
  forgotOtp_Get,
  forgotOtp_Post,
  resetPassword_Get,
  resetPassword_Post,
  forgotResentOtp,
};
