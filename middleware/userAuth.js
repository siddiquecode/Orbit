const userDB = require("../models/user");

const userAuthenticated = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const user = await userDB.findOne({ email: req.session.user });

      if (!user) {
        req.session.destroy();
        return res.redirect("/userlogin");
      }

      if (user.isBlocked) {
        delete req.session.user;
        req.flash("error", "Your account has been blocked by admin.");
        return res.redirect("/userlogin");
      }

      req.user = user;
      res.locals.user = user;
      res.locals.isLoggedIn = true;
      return next();
    } else {
      return res.redirect("/userlogin");
    }
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  userAuthenticated,
};





















/* const userAuthenticated = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await userDB.findOne({ email: req.session.user });
      if (user.isBlocked) {
        delete req.session.user;
        req.flash("error", "Your account has been blocked by admin.");
        res.redirect("/userlogin");
      } else {
        next();
      }
    } else {
      res.redirect("/userlogin");
    }
  } catch (error) {
    console.error("Error in userAuthenticated middleware:", error);
    res.status(500).send("Internal Server Error");
  }
};

const isLoggedIn = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const user = await userDB.findOne({ email: req.session.user });

      if (user) {
        req.user = user;
        res.locals.user = user;
        res.locals.isLoggedIn = true;
        return next();
      } else {
        req.session.destroy();
        return res.redirect("/userlogin");
      }
    } else {
      return res.redirect("/userlogin");
    }
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  userAuthenticated,
  isLoggedIn,
}; */
