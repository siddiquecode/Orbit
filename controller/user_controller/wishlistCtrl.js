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

const userwishlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const wishlist = await wishlistDB
      .findOne({ user: req.user._id })
      .populate({ path: "items.productId", populate: { path: "category" } });

    const wishlistCount = wishlist ? wishlist.items.length : 0;

    const paginatedItems =
      wishlist && wishlist.items.length > 0
        ? wishlist.items.slice(skip, skip + limit)
        : [];

    paginatedItems.forEach((item) => {
      const product = item.productId;

      const discountedPrice = product.discountedPrice;
      product.finalDiscountedPrice = discountedPrice;

      const productDiscount = product.discount || 0;
      const categoryDiscount = product.category?.discount || 0;
      product.maxDiscount = Math.max(productDiscount, categoryDiscount);

      if (product.stock <= 10) {
        product.stockWarning = `Only ${product.stock} left in stock for ${product.productName}!`;
      } else {
        product.stockWarning = "";
      }
    });

    const totalPages = Math.ceil(wishlistCount / limit);

    res.render("user/wishlist", {
      user: req.user,
      isLoggedIn: true,
      pageName: "wishlist",
      wishlist: { items: paginatedItems },
      wishlistCount,
      currentPage: page,
      totalPages: totalPages,
      Message: req.flash("message"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const add_wishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;

    let userwish = await wishlistDB.findOne({ user: user._id });

    if (!userwish) {
      userwish = new wishlistDB({
        user: user._id,
        items: [{ productId: productId }],
      });
    } else {
      if (userwish.items.length >= 5) {
        req.flash(
          "message",
          "You can only add a maximum of 5 itmes to your wishlist."
        );
        return res.redirect("/userwishlist");
      }
      
      const isProductInWishlist = userwish.items.some(
        (item) => item.productId.toString() === productId
      );

      if (isProductInWishlist) {
        req.flash("message", "This product is already in your wishlist.");
        return res.redirect("/userwishlist");
      } else {
        userwish.items.push({ productId: productId });
      }
    }

    await userwish.save();
    req.flash("message", "Product added to your wishlist successfully.");
    res.redirect("/userwishlist");
  } catch (error) {
    console.log(error);
  }
};

const remove_wishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;

    const userwish = await wishlistDB.findOne({ user: user._id });

    if (userwish) {
      const itemIndex = userwish.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex !== -1) {
        userwish.items.splice(itemIndex, 1);
        await userwish.save();
        return res
          .status(200)
          .json({ success: true, message: "Item removed from wishlist" });
      }
    }

    return res
      .status(404)
      .json({ success: false, message: "Item not found in wishlist" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

const go_to_cart = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;

    const wishlist = await wishlistDB.findOne({ user: user._id });
    if (!wishlist) {
      return res.redirect("/userwishlist");
    }

    const productInWishlist = wishlist.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!productInWishlist) {
      return res.redirect("/userwishlist");
    }

    const product = await productDB.findById(productId);
    if (!product) {
      return res.redirect("/userwishlist");
    }

    if (product.stock <= 0) {
      req.flash("message", "This product is out of stock.");
      return res.redirect("/userwishlist");
    }

    let cart = await cartDB.findOne({ user: user._id });

    if (!cart) {
      cart = new cartDB({
        user: user._id,
        items: [],
      });
    }

    if (cart.items.length >= 5) {
      req.flash("message", "You can only buy a maximum of 5 items at a time.");
      return res.redirect("/cart");
    }

    const productInCart = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (productInCart) {
      req.flash("message", "This product is already added to the cart");
    } else {
      cart.items.push({ productId, quantity: 1 });
      await cart.save();
      req.flash("message", "Product added to the cart");

      wishlist.items = wishlist.items.filter(
        (item) => item.productId.toString() !== productId
      );
      await wishlist.save();
    }

    return res.redirect("/cart");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while processing your request.");
    return res.redirect("/userwishlist");
  }
};

const userwallet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let wallet = await WalletDB.findOne({ user: req.user._id })
      .skip(skip)
      .limit(limit);

    const totalOrders = await WalletDB.countDocuments({ userId: req.user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    if (!wallet) {
      wallet = { balance: 0, transactions: [] };
    }

    res.render("user/wallet", {
      user: req.user,
      isLoggedIn: true,
      pageName: "wallet",
      wallet,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userwishlist,
  add_wishlist,
  remove_wishlist,
  go_to_cart,
  userwallet,
};
