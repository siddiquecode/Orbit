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

const getoffer = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.page) || 1;
    const totalOffers = await offerDB.countDocuments();
    const totalPages = Math.ceil(totalOffers / itemsPerPage);

    const offers = await offerDB
      .find()
      .populate("category", "categoryName")
      .populate("product", "productName")
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    res.render("admin/offer", {
      offers,
      currentPage,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching offers");
  }
};

const addoffer_get = async (req, res) => {
  try {
    res.render("admin/add_offer", { errorMessage: req.flash("error") });
  } catch (error) {
    console.log(error);
  }
};

const addoffer = async (req, res) => {
  try {
    const { offerType, name, discount } = req.body;

    const existingOffer = await offerDB.findOne({ offerType, name });
    if (existingOffer) {
      req.flash("error", "This offer already exists for the selected name.");
      return res.redirect("/admin/addoffer");
    }

    const newOffer = new offerDB({
      offerType,
      name,
      discount,
      category: offerType === "Category" ? name : undefined,
      product: offerType === "Product" ? name : undefined,
    });

    await newOffer.save();

    if (offerType === "Category") {
      const category = await categoryDB.findById(name);

      if (category) {
        category.discount = discount;
        await category.save();
      }
    }

    if (offerType === "Product") {
      const product = await productDB.findById(name);

      if (product) {
        product.discount = discount;
        await product.save();
      }
    }

    res.redirect("/admin/getoffer");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error adding offer and updating category or product");
  }
};

const getOptions = async (req, res) => {
  try {
    const { offerType } = req.query;
    let options;

    if (offerType === "Category") {
      options = await categoryDB.find({}, "categoryName");
    } else if (offerType === "Product") {
      options = await productDB.find({}, "productName");
    }

    res.json(options);
  } catch (error) {
    console.log(error);
  }
};

const editoffer_get = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await offerDB
      .findById(offerId)
      .populate("category", "categoryName")
      .populate("product", "productName");

    res.render("admin/edit_offer", {
      offer,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

const editoffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const { offerType, name, discount } = req.body;

    const existingOffer = await offerDB.findOne({
      offerType,
      name,
      _id: { $ne: offerId },
    });

    if (existingOffer) {
      req.flash("error", "This offer already exists for the selected name.");
      return res.redirect(`/admin/editoffer/${offerId}`);
    }

    await offerDB.findByIdAndUpdate(
      offerId,
      {
        offerType,
        name,
        discount,
        category: offerType === "Category" ? name : undefined,
        product: offerType === "Product" ? name : undefined,
      },
      { new: true }
    );

    if (offerType === "Category") {
      const category = await categoryDB.findById(name);
      if (category) {
        category.discount = discount;
        await category.save();
      }
    }

    if (offerType === "Product") {
      const product = await productDB.findById(name);
      if (product) {
        product.discount = discount;
        await product.save();
      }
    }

    res.json({ success: true, message: "Offer updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const deleteoffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await offerDB.findById(offerId);

    if (!offer) {
      return res.status(404).send("offer not found");
    }

    if (offer.offerType === "Category") {
      await categoryDB.findByIdAndUpdate(offer.category, { discount: 0 });
    } else if (offer.offerType === "Product") {
      await productDB.findByIdAndUpdate(offer.product, { discount: 0 });
    }

    await offerDB.findByIdAndDelete(offerId);
    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

module.exports = {
  getoffer,
  addoffer_get,
  addoffer,
  getOptions,
  editoffer_get,
  editoffer,
  deleteoffer,
};
