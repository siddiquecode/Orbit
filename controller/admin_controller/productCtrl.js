const categoryDB = require("../../models/category");
const productDB = require("../../models/products");

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

const Addproduct_get = async (req, res) => {
  try {
    const category = await categoryDB.find();
    res.render("admin/add_product", {
      category,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching categories");
  }
};

const Addproduct = async (req, res) => {
  try {
    const { productName, category, price, stock, description } = req.body;
    const productImages = req.files;

    if (!productName || productName.trim() === "") {
      req.flash("error", "Please enter a valid product name.");
      return res.redirect("/admin/addproduct");
    }
    if (!category || category === "Select Category") {
      req.flash("error", "Please select a category.");
      return res.redirect("/admin/addproduct");
    }
    if (!price || price <= 0) {
      req.flash("error", "Please enter a valid price.");
      return res.redirect("/admin/addproduct");
    }
    if (!stock || stock <= 0) {
      req.flash("error", "Please enter a valid stock amount.");
      return res.redirect("/admin/addproduct");
    }
    if (!description || description.trim() === "") {
      req.flash("error", "Description cannot be empty or contain only spaces.");
      return res.redirect("/admin/addproduct");
    }
    if (!productImages || productImages.length === 0) {
      req.flash("error", "Please select at least one image.");
      return res.redirect("/admin/addproduct");
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
      productImage: productImagePaths,
    });

    res.redirect("/admin/getproduct");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error adding product");
  }
};

const Editproduct_get = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productDB.findById(productId);
    const category = await categoryDB.find();
    res.render("admin/edit_product", {
      product,
      category,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

const Editproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, category, price, stock, description } = req.body;
    const productImages = req.files;

    const product = await productDB.findById(productId);

    if (!productName || productName.trim() === "") {
      req.flash("error", "Please enter a valid product name.");
      return res.redirect(`/admin/editproduct/${productId}`);
    }
    if (!category || category === "Select Category") {
      req.flash("error", "Please select a category.");
      return res.redirect(`/admin/editproduct/${productId}`);
    }
    if (!price || price <= 0) {
      req.flash("error", "Please enter a valid price.");
      return res.redirect(`/admin/editproduct/${productId}`);
    }
    if (!stock || stock <= 0) {
      req.flash("error", "Please enter a valid stock amount.");
      return res.redirect(`/admin/editproduct/${productId}`);
    }
    if (!description || description.trim() === "") {
      req.flash("error", "Description cannot be empty or contain only spaces.");
      return res.redirect(`/admin/editproduct/${productId}`);
    }
    if (productImages && productImages.length > 0) {
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/jfif",
        "image/webp",
      ];
      const invalidImages = productImages.filter(
        (image) => !validImageTypes.includes(image.mimetype)
      );

      if (invalidImages.length > 0) {
        req.flash(
          "error",
          "Please upload valid images (JPEG, PNG, JPG, JFIF, WEBP)."
        );
        return res.redirect(`/admin/editproduct/${productId}`);
      }
    }

    const productImagePaths = productImages.length
      ? productImages.map((file) => `/uploads/${file.filename}`)
      : product.productImage;

    await productDB.findByIdAndUpdate(productId, {
      productName,
      category,
      price,
      stock,
      description,
      productImage: productImagePaths,
    });

    res.redirect("/admin/getproduct");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating product");
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

module.exports = {
  getproduct,
  Addproduct_get,
  Addproduct,
  Editproduct_get,
  Editproduct,
  blockproduct,
  unblockproduct,
};
