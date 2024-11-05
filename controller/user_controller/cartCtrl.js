const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const categoryDB = require("../../models/category");
const couponDB = require("../../models/coupon");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const userDB = require("../../models/user");
const WalletDB = require("../../models/wallet");
const wishlistDB = require("../../models/wishlist");

const cart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await cartDB.findOne({ user: userId }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart) {
      return res.render("user/cart", {
        user: req.user,
        isLoggedIn: true,
        cart: null,
        pageName: "cart",
        total: 0,
        addressId: req.user.defaultAddressId || "",
        subtotal: 0,
        cartTotalDiscountedPrice: 0,
        shippingFee: 0,
        totalDiscount: 0,
        Message: req.flash("message"),
        coupons: [],
      });
    }

    const coupons = await couponDB.find({
      expireDate: { $gt: new Date() },
    });

    let cartTotalDiscountedPrice = 0;
    let totalDiscount = 0;
    let subtotal = 0;
    let discounts = [];

    if (cart.items && cart.items.length > 0) {
      cart.items.forEach((item) => {
        if (item && item.productId) {
          const product = item.productId;

          const discountedPrice = product.discountedPrice || product.price;
          subtotal += product.price * item.quantity;
          cartTotalDiscountedPrice += discountedPrice * item.quantity;

          const productDiscount = product.discount || 0;
          const categoryDiscount = product.category.discount || 0;
          const maxDiscount = Math.max(productDiscount, categoryDiscount);
          discounts.push(maxDiscount);
        }
      });

      if (discounts.length > 0) {
        totalDiscount = Math.max(...discounts);
        const totalDiscountSum = discounts.reduce(
          (acc, discount) => acc + discount,
          0
        );
        const averageDiscount = totalDiscountSum / discounts.length;
        totalDiscount = averageDiscount;
      }
    }

    const shippingFee = subtotal > 1000 ? 0 : 50;
    const total = cartTotalDiscountedPrice + shippingFee;

    if (cart.couponApplied === undefined) {
      cart.couponApplied = false;
      await cart.save();
    }

    const addressId = req.user.defaultAddressId || "";

    res.render("user/cart", {
      user: req.user,
      isLoggedIn: true,
      cart,
      pageName: "cart",
      total,
      addressId,
      subtotal,
      cartTotalDiscountedPrice,
      shippingFee,
      totalDiscount,
      Message: req.flash("message"),
      coupons,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).send("An error occurred while fetching the cart");
  }
};

const add_cart = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;

    const product = await productDB.findById(productId);

    if (product.stock <= 0) {
      req.flash("message", "This product is out of stock");
      return res.redirect(`/productdetails/${productId}`);
    }

    let userCart = await cartDB.findOne({ user: user._id });

    if (!userCart) {
      userCart = new cartDB({
        user: user._id,
        items: [{ productId: productId, quantity: 1 }],
      });
    } else {
      if (userCart.items.length >= 5) {
        req.flash(
          "message",
          "You can only buy a maximum of 5 items at a time."
        );
        return res.redirect("/cart");
      }

      const existingCartItemsIndex = userCart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (existingCartItemsIndex !== -1) {
        req.flash("message", "This product is already added to the cart");
        return res.redirect("/cart");
      } else {
        userCart.items.push({ productId: productId, quantity: 1 });
      }
    }

    await userCart.save();
    req.flash("message", "Product added to the cart successfully.");
    return res.redirect("/cart");
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred while adding to the cart");
  }
};

const update_quantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    const user = req.user;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    let userCart = await cartDB.findOne({ user: user._id });

    if (!userCart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found" });
    }

    const itemIndex = userCart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex !== -1) {
      const product = await productDB.findById(productId);

      if (!product) {
        return res
          .status(400)
          .json({ success: false, message: "Product not found" });
      }

      const availableStock = product.stock;
      const requestedQuantity = parseInt(quantity);

      if (requestedQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available stock: ${availableStock}`,
        });
      }

      userCart.items[itemIndex].quantity = requestedQuantity;
      await userCart.save();

      product.stock =
        availableStock -
        (requestedQuantity - userCart.items[itemIndex].quantity);
      await product.save();

      let cartSubtotal = 0;
      userCart.items.forEach((item) => {
        if (item && item.productId && item.productId.price) {
          cartSubtotal += item.productId.price * item.quantity;
        }
      });

      const shippingFee = cartSubtotal > 1000 ? 0 : 50;
      const total = cartSubtotal + shippingFee;

      return res.status(200).json({
        success: true,
        cartSubtotal,
        total,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const remove_item = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.user;
    const userCart = await cartDB.findOne({ user: user._id });

    if (!userCart) {
      return res.status(404).send("Items not found");
    }

    const itemIndex = userCart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      req.flash("message", "Product not found in cart");
      return res.redirect("/cart");
    }

    const product = await productDB.findById(productId);
    if (product) {
      product.stock + userCart.items[itemIndex].quantity;
      await product.save();
    }

    userCart.items.splice(itemIndex, 1);
    await userCart.save();

    return res.redirect("/cart");
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("An error occurred while removing the product from the cart");
  }
};

module.exports = {
  cart,
  add_cart,
  update_quantity,
  remove_item,
};
