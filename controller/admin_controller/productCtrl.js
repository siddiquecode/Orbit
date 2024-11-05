const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");

const getproduct = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page) || 1;

    const category = await categoryDB.find();

    const totalProducts = await productDB.countDocuments();
    const product = await productDB
      .find()
      .populate("category")
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    res.render("admin/products", {
      category,
      product,
      currentPage: page,
      totalPages,
      itemsPerPage,
    });
  } catch (error) {
    console.log(error);
  }
};

const addproduct = async (req, res) => {
  try {
    const { productName, category, price, stock, description, discount } =
      req.body;
    const productImages = req.files;

    if (!productName || !productName.trim()) {
      return res.json({ error: "Please enter a valid product name" });
    }

    if (!category) {
      return res.json({ error: "Please select a category" });
    }

    if (!price || price <= 0) {
      return res.json({ error: "Please enter a valid price" });
    }

    if (!stock || stock <= 0) {
      return res.json({ error: "Please enter a valid stock amount" });
    }

    if (!description || !description.trim()) {
      return res.json({
        error: "Description cannot be empty or contain only spaces",
      });
    }

    if (!discount || discount <= 0 || discount >= 100) {
      return res.json({ error: "Please enter a valid discount" });
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/jfif",
      "image/webp",
    ];
    if (!productImages || productImages.length === 0) {
      return res.json({ error: "Please select an image" });
    }

    const invalidImage = productImages.find(
      (img) => !validImageTypes.includes(img.mimetype)
    );
    if (invalidImage) {
      return res.json({
        error: "Please upload a valid image (JPEG, PNG, JPG , JFIF)",
      });
    }

    const productImagePaths = productImages.map(
      (file) => `/uploads/${file.filename}`
    );

    const newProduct = await productDB.create({
      productName,
      category,
      price,
      stock,
      description,
      discount,
      productImage: productImagePaths,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const editproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, category, price, stock, description, discount } =
      req.body;

    let updateData = {
      productName,
      category,
      price,
      stock,
      description,
      discount,
    };

    const existingProduct = await productDB.findById(productId);

    if (req.files && req.files.length > 0) {
      updateData.productImage = req.files.map(
        (file) => `/uploads/${file.filename}`
      );
    } else {
      updateData.productImage = existingProduct.productImage;
    }

    const updatedProduct = await productDB.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    console.log("Updated Product:", updatedProduct);

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const blockproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await productDB.findByIdAndUpdate(productId, { isBlocked: true });
    res.redirect("/admin/getproduct");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
};

const unblockproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await productDB.findByIdAndUpdate(productId, { isBlocked: false });
    res.redirect("/admin/getproduct");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
};

const deleteproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await productDB.findByIdAndDelete(productId);
    res.redirect("/admin/getproduct");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  getproduct,
  addproduct,
  editproduct,
  blockproduct,
  unblockproduct,
  deleteproduct,
};
