const addressDB = require("../../models/address");
const { logout } = require("./homeCtrl");

const userAddress = async (req, res) => {
  try {
    const address = await addressDB.find({ user: req.user._id });

    res.render("user/address", {
      user: req.user,
      isLoggedIn: true,
      address,
      pageName: "address",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress_Get = async (req, res) => {
  try {
    const address = await addressDB.findOne({ user: req.user._id });

    res.render("user/add_address", {
      user: req.user,
      isLoggedIn: true,
      address,
      pageName: "add_address",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress_Post = async (req, res) => {
  try {
    const address = new addressDB({
      user: req.user._id,
      name: req.body.name,
      mobileNumber: req.body.mobile,
      pincode: req.body.pincode,
      locality: req.body.locality,
      address: req.body.address,
      district: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark,
      alternateMobile: req.body.alternate_phone,
      type: req.body.addressType || "home",
    });
    await address.save();
    res.redirect("/useraddress");
  } catch (error) {
    console.log(error);
  }
};

const editAddress_Get = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await addressDB.findById(addressId);

    res.render("user/edit_address", {
      address,
      user: req.user,
      isLoggedIn: true,
      pageName: "edit_address",
    });
  } catch (error) {
    console.log(error);
  }
};

const editAddress_Post = async (req, res) => {
  try {
    const addressId = req.params.id;

    await addressDB.findByIdAndUpdate(addressId, {
      name: req.body.name,
      mobileNumber: req.body.mobile,
      pincode: req.body.pincode,
      locality: req.body.locality,
      address: req.body.address,
      district: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark,
      alternateMobile: req.body.alternate_phone,
      type: req.body.addressType || "home",
    });

    res.redirect("/useraddress");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    res.redirect("/useraddress");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userAddress,
  addAddress_Get,
  addAddress_Post,
  editAddress_Get,
  editAddress_Post,
  deleteAddress,
};
