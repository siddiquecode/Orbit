const categoryDB = require("../../models/category");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const { totp } = require("otplib");

const home = async (req, res) => {
  try {
    const isLoggedIn = req.session.user ? true : false;
    let user = null;

    if (isLoggedIn) {
      user = await userDB.findOne({ email: req.session.user });

      if (user && user.isBlocked) {
        req.session.destroy((err) => {
          if (err) {
            console.log(err);
          }
          return res.redirect("/");
        });
        return;
      }
    }

    const categories = await categoryDB.find({ isBlocked: false });
    const categoryId = categories.map((category) => category._id);

    // limited offers
    const limitedOffers = await productDB
      .find({
        category: { $in: categoryId },
        isBlocked: false,
      })
      .limit(4)
      .populate("category");

    // new arrivals
    const newArrivals = await productDB
      .find({
        category: { $in: categoryId },
        isBlocked: false,
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("category");

    const updatedLimitedOffers = limitedOffers.map((product) => ({
      ...product.toObject(),
      finalDiscountedPrice: product.discountedPrice,
    }));

    const updatedNewArrivals = newArrivals.map((product) => ({
      ...product.toObject(),
      finalDiscountedPrice: product.discountedPrice,
    }));

    res.render("user/home", {
      user,
      isLoggedIn,
      pageName: "home",
      limitedOffers: updatedLimitedOffers,
      newArrivals: updatedNewArrivals,
      categories,
    });
  } catch (error) {
    console.error("Error in the home controller:", error);
    res.status(500).send("Server error");
  }
};

const searchCategory = async (req, res) => {
  try {
    const isLoggedIn = req.session.user ? true : false;
    user = await userDB.findOne({ email: req.session.user });
    const searchQuery = req.query.search;

    const categories = await categoryDB.find({
      categoryName: { $regex: `^${searchQuery}`, $options: "i" },
      isBlocked: false,
    });

    const categoryId = categories.map((category) => category._id);

    const sort = req.query.sort || "popularity";
    let sortOptions = {};
    switch (sort) {
      case "priceLowToHigh":
        sortOptions = { price: 1 };
        break;
      case "priceHighToLow":
        sortOptions = { price: -1 };
        break;
      case "newArrivals":
        sortOptions = { createdAt: -1 };
        break;
      case "alphabeticalAsc":
        sortOptions = { productName: 1 };
        break;
      case "alphabeticalDesc":
        sortOptions = { productName: -1 };
        break;
      default:
        sortOptions = { popularity: -1 };
    }

    const page = parseInt(req.params.page) || 1;
    const itemsPerPage = 9;

    const totalProducts = await productDB.countDocuments({
      category: { $in: categoryId },
      isBlocked: false,
    });

    let products = await productDB
      .find({
        category: { $in: categoryId },
        isBlocked: false,
      })
      .sort(sortOptions)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .populate("category");

    products = products.map((product) => ({
      ...product.toObject(),
      finalDiscountedPrice: product.discountedPrice,
    }));

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    res.render("user/productList", {
      user,
      isLoggedIn,
      pageName: "productList",
      products,
      categories,
      sort,
      currentPage: page,
      totalPages,
      showSidebar: true,
      showPagination: totalProducts > 0,
      selectedCategoryId: categoryId[0],
      message: null,
      searchQuery,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const productList = async (req, res) => {
  try {
    const isLoggedIn = req.session.user ? true : false;
    user = await userDB.findOne({ email: req.session.user });
    const searchQuery = req.query.search;

    const categories = await categoryDB.find({ isBlocked: false });
    const selectedCategoryId = req.query.category;

    const sort = req.query.sort || "popularity";
    const page = parseInt(req.params.page) || 1;
    const itemsPerPage = 9;

    let sortOptions = {};
    switch (sort) {
      case "priceLowToHigh":
        sortOptions = { price: 1 };
        break;
      case "priceHighToLow":
        sortOptions = { price: -1 };
        break;
      case "newArrivals":
        sortOptions = { createdAt: -1 };
        break;
      case "alphabeticalAsc":
        sortOptions = { productName: 1 };
        break;
      case "alphabeticalDesc":
        sortOptions = { productName: -1 };
        break;
      default:
        sortOptions = { popularity: -1 };
    }

    let productFilter = { isBlocked: false };

    if (selectedCategoryId) {
      productFilter.category = selectedCategoryId;
    } else {
      productFilter.category = {
        $in: categories.map((category) => category._id),
      };
    }

    if (searchQuery) {
      productFilter.productName = { $regex: `${searchQuery}`, $options: "i" };
    }

    const totalProducts = await productDB.countDocuments(productFilter);
    const products = await productDB
      .find(productFilter)
      .populate("category")
      .sort(sortOptions)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const updatedProducts = products.map((product) => {
      return {
        ...product.toObject(),
        finalDiscountedPrice: product.discountedPrice,
      };
    });
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const showPagination = totalPages > 1;

    res.render("user/productList", {
      user,
      isLoggedIn,
      pageName: "productList",
      products: updatedProducts,
      categories,
      sort,
      currentPage: page,
      totalPages,
      selectedCategoryId,
      searchQuery,
      showSidebar: totalProducts > 0,
      showPagination,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await productDB.findById(productId).populate("category");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const discountedPrice = product.discountedPrice;

    if (product.stock <= 10) {
      product.stockWarning = `Only ${product.stock} left in stock for ${product.productName}!`;
    } else {
      product.stockWarning = "";
    }

    res.render("user/proDetails", {
      pageName: "proDetails",
      user: req.user,
      isLoggedIn: true,
      product,
      discountedPrice,
      Message: req.flash("message"),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const categories = async (req, res) => {
  try {
    const isLoggedIn = req.session.user ? true : false;
    user = await userDB.findOne({ email: req.session.user });

    const { categoryId } = req.params;
    const sort = req.query.sort || "popularity";

    const categories = await categoryDB.find({ isBlocked: false });

    const searchQuery = req.query.search || "";

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const totalProducts = await productDB.countDocuments({
      category: categoryId,
      isBlocked: false,
    });

    let sortOptions = {};
    switch (sort) {
      case "priceLowToHigh":
        sortOptions = { price: 1 };
        break;
      case "priceHighToLow":
        sortOptions = { price: -1 };
        break;
      case "newArrivals":
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { popularity: -1 };
    }

    let products = await productDB
      .find({
        category: categoryId,
        isBlocked: false,
      })
      .sort(sortOptions)
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .populate("category");

    products = products.map((product) => ({
      ...product.toObject(),
      finalDiscountedPrice: product.discountedPrice,
    }));

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const showSidebar = true;

    const showPagination = totalPages > 1;

    res.render("user/productList", {
      user,
      isLoggedIn,
      pageName: "productList",
      products,
      categories,
      currentPage: page,
      totalPages,
      selectedCategoryId: categoryId,
      sort,
      showSidebar,
      showPagination,
      searchQuery,
    });
  } catch (error) {
    console.error("Error in categories controller:", error);
    res.status(500).send("Server error");
  }
};

const logout = (req, res) => {
  req.session.user = false;
  res.redirect("/");
};

module.exports = {
  home,
  searchCategory,
  productList,
  productDetails,
  categories,
  logout,
};
