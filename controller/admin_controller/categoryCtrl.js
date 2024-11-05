const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");

const getcategory = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page || 1);

    const totalCategories = await categoryDB.countDocuments();
    const category = await categoryDB
      .find()
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalCategories / itemsPerPage);

    res.render("admin/categories", {
      category,
      currentPage: page,
      totalPages,
      itemsPerPage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const addcategory = async (req, res) => {
  try {
    const { categoryName, description, discount } = req.body;
    const categoryImages = req.files;

    if (!categoryName || !categoryName.trim()) {
      return res.json({
        error:
          "Please enter a valid category name without spaces before and after",
      });
    }

    if (!description || !description.trim()) {
      return res.json({
        error: "Description cannot be empty or contain only spaces",
      });
    }

    if (!discount || discount <= 0 || discount >= 100) {
      return res.json({ error: "Please enter a valid discount" });
    }

    const existingCategory = await categoryDB.findOne({
      categoryName: new RegExp(`^${categoryName.trim()}$`, "i"),
    });

    if (existingCategory) {
      return res.json({
        error: "This category is already added",
      });
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/jfif",
    ];

    if (!categoryImages || categoryImages.length === 0) {
      return res.json({ error: "Please select an image" });
    }

    const invalidImage = categoryImages.find(
      (img) => !validImageTypes.includes(img.mimetype)
    );
    if (invalidImage) {
      return res.json({
        error: "Please upload a valid image (JPEG, PNG, JPG, JFIF)",
      });
    }

    const categoryImagePaths = categoryImages.map(
      (file) => `/uploads/${file.filename}`
    );

    const newCategory = await categoryDB.create({
      categoryName: categoryName.trim(),
      description: description.trim(),
      discount: discount,
      categoryImage: categoryImagePaths,
    });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const editcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName, description, discount } = req.body;

    let updateData = {
      categoryName,
      description,
      discount,
    };

    if (req.files && req.files.length > 0) {
      updateData.categoryImage = req.files.map(
        (file) => `/uploads/${file.filename}`
      );
    }

    const updatedCategory = await categoryDB.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    );

    console.log("Updated Category:", updatedCategory);

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const blockcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await categoryDB.findByIdAndUpdate(categoryId, { isBlocked: true });
    await productDB.updateMany({ category: categoryId }, { isBlocked: true });
    res.redirect("/admin/getcategory");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
};

const unblockcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await categoryDB.findByIdAndUpdate(categoryId, { isBlocked: false });
    await productDB.updateMany({ category: categoryId }, { isBlocked: false });
    res.redirect("/admin/getcategory");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
};

const deletecategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    await productDB.deleteMany({ category: categoryId });

    await categoryDB.findByIdAndDelete(categoryId);

    res.redirect("/admin/getcategory");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  getcategory,
  addcategory,
  editcategory,
  blockcategory,
  unblockcategory,
  deletecategory,
};
