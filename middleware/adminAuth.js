const adminAuthenticated = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("/admin");
  }
};

module.exports = {
    adminAuthenticated,
};
