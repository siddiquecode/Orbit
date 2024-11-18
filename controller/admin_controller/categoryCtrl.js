const categoryDB = require("../../models/category");
const productDB = require("../../models/products");

const getcategory = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page || 1);

    const totalCategories = await categoryDB.countDocuments();
    const category = await categoryDB
      .find()
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalCategories / itemsPerPage)

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

const Addcategory_get = async (req, res) => {
  try {
    res.render("admin/add_category", {
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

const Addcategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    const categoryImage = req.files;

    if (!categoryName || !categoryName.trim()) {
      req.flash(
        "error",
        "Please enter a valid category name without spaces before and after."
      );
      return res.redirect("/admin/addcategory");
    }

    if (!description || !description.trim()) {
      req.flash("error", "Description cannot be empty or contain only spaces.");
      return res.redirect("/admin/addcategory");
    }

    if (!categoryImage || categoryImage.length === 0) {
      req.flash("error", "Please upload at least one image.");
      return res.redirect("/admin/addcategory");
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/jfif",
      "image/webp",
    ];
    const invalidImages = categoryImage.filter(
      (img) => !validImageTypes.includes(img.mimetype)
    );

    if (invalidImages.length > 0) {
      req.flash(
        "error",
        "Please upload valid images (JPEG, PNG, JPG, JFIF, WEBP)."
      );
      return res.redirect("/admin/addcategory");
    }

    const imagePath = categoryImage.map((file) => `/uploads/${file.filename}`);


    await categoryDB.create({
      categoryName: categoryName.trim(),
      description: description.trim(),
      categoryImage: imagePath,
    });


    res.redirect("/admin/getcategory");
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send("Error adding category");
  }
};

const Editcategory_get = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryDB.findById(categoryId);
    res.render("admin/edit_category", {
      category,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.log(error);
  }
};

const Editcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName, description } = req.body;
    const categoryImage = req.files;

    const category = await categoryDB.findById(categoryId);

    if (!category) {
      req.flash("error", "Category not found.");
      return res.redirect(`/admin/Editcategory/${categoryId}`);
    }

    if (!categoryName || !categoryName.trim()) {
      req.flash("error", "Please enter a valid category name.");
      return res.redirect(`/admin/Editcategory/${categoryId}`);
    }

    if (!description || !description.trim()) {
      req.flash("error", "Description cannot be empty or contain only spaces.");
      return res.redirect(`/admin/Editcategory/${categoryId}`);
    }

    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/jfif",
      "image/webp",
    ];
    let imagePath = category.categoryImage;

    if (categoryImage && categoryImage.length > 0) {
      const invalidImages = categoryImage.filter(
        (img) => !validImageTypes.includes(img.mimetype)
      );

      if (invalidImages.length > 0) {
        req.flash(
          "error",
          "Please upload valid images (JPEG, PNG, JPG, JFIF, WEBP)."
        );
        return res.redirect(`/admin/Editcategory/${categoryId}`);
      }

      imagePath = categoryImage.map((file) => `/uploads/${file.filename}`);
    }

    await categoryDB.findByIdAndUpdate(categoryId, {
      categoryName: categoryName,
      description: description,
      categoryImage: imagePath,
    });

    res.redirect("/admin/getcategory");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Error updating category");
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

module.exports = {
  getcategory,
  Addcategory_get,
  Addcategory,
  Editcategory_get,
  Editcategory,
  blockcategory,
  unblockcategory,
};
