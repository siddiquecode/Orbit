const addressDB = require("../../models/address");
const cartDB = require("../../models/cart");
const orderDB = require("../../models/order");
const productDB = require("../../models/products");
const WalletDB = require("../../models/wallet");
const Razorpay = require("razorpay");
const crypto = require("crypto");

var razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const userCheckout = async (req, res) => {
  try {
    const user = req.user;

    const address = await addressDB.find({ user: user._id });

    const cart = await cartDB.findOne({ user: user._id }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart || cart.items.length === 0) {
      return res.redirect("/userorders");
    }

    const wallet = await WalletDB.findOne({ user: user._id });

    let subtotal = 0;
    let cartTotalDiscountedPrice = 0;
    let totalDiscount = 0;
    let totalQuantity = 0;
    let deliveryCharge = 50;
    let discounts = [];

    const product = cart.items
      .filter((item) => item.productId)
      .map((item) => {
        const product = item.productId;
        const discountedPrice = product.discountedPrice;

        subtotal += product.price * item.quantity;
        cartTotalDiscountedPrice += discountedPrice * item.quantity;

        const productDiscount = product.discount || 0;
        const categoryDiscount = product.category?.discount || 0;
        const maxDiscount = Math.max(productDiscount, categoryDiscount);
        discounts.push(maxDiscount);

        totalQuantity += item.quantity;

        return {
          productName: product.productName,
          productImage: product.productImage,
          price: product.price,
          discountedPrice: discountedPrice,
          productDiscount: productDiscount,
          categoryDiscount: categoryDiscount,
          discount: maxDiscount,
          quantity: item.quantity,
        };
      });

    if (discounts.length > 0) {
      const totalDiscountSum = discounts.reduce(
        (acc, discount) => acc + discount,
        0
      );
      const averageDiscount = totalDiscountSum / discounts.length;
      totalDiscount = averageDiscount;
    }

    if (subtotal > 1000) {
      deliveryCharge = 0;
    }

    let totalAmount = cartTotalDiscountedPrice + deliveryCharge;
    let newTotalAmount = totalAmount;

    if (cart.couponApplied) {
      newTotalAmount =
        totalAmount - (totalAmount * cart.couponDiscountPercentage) / 100;
    } else {
      newTotalAmount = totalAmount;
    }

    const usedReferralCode =
      user.usedReferralCode || req.session.referralCode || "";

    res.render("user/checkout", {
      user,
      product,
      address,
      totalQuantity,
      subtotal,
      cartTotalDiscountedPrice,
      totalDiscount,
      deliveryCharge,
      totalAmount,
      newTotalAmount,
      cart,
      walletBalance: wallet ? wallet.balance : 0,
      pageName: "checkout",
      errorMessage: req.flash("error"),
      referralCode: usedReferralCode,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutAddress_Get = async (req, res) => {
  try {
    const user = req.user;
    const address = await addressDB.findOne({ user: user._id });

    res.render("user/add_checkout_address", {
      user,
      address,
      pageName: "add_checkout_address",
    });
  } catch (error) {
    console.log(error);
  }
};

const checkoutAddress_Post = async (req, res) => {
  try {
    const user = req.user;

    const address = new addressDB({
      user: user._id,
      name: req.body.name,
      mobileNumber: req.body.mobile,
      pincode: req.body.pincode,
      locality: req.body.locality,
      address: req.body.address,
      district: req.body.district,
      state: req.body.state,
      landmark: req.body.landmark,
      alternateMobile: req.body.alternate_phone,
      type: req.body.addressType || "home",
    });
    await address.save();
    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
  }
};

const editCheckoutAddress_Get = async (req, res) => {
  try {
    const addressId = req.params.id;
    const user = req.user;

    const address = await addressDB.findById(addressId);

    const productId = req.query.productId || req.session.productId;
    const product = await productDB.findById(productId);

    const order = await orderDB.findOne({ userId: req.session.userId });

    res.render("user/edit_checkout_address", {
      user,
      address,
      product,
      order,
      pageName: "edit_checkout_address",
    });
  } catch (error) {
    console.log(error);
  }
};

const editCheckoutAddress_Post = async (req, res) => {
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

    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
};

const codController = async (req, res) => {
  try {
    const user = req.user;
    const { addressId } = req.body;

    const address = await addressDB.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const cart = await cartDB
      .findOne({ user: user._id })
      .populate({
        path: "items.productId",
        populate: { path: "category", model: "categoryDB" },
      })
      .exec();

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const validItems = cart.items.filter(
      (item) => item.productId && item.productId._id
    );
    if (!validItems.length) {
      return res.status(400).json({ message: "Cart contains invalid items" });
    }

    const totalAmount =
      validItems.reduce((total, item) => {
        return total + item.productId.discountedPrice * item.quantity;
      }, 0) + 50;

    if (isNaN(totalAmount)) {
      return res.status(400).json({ message: "Total amount is invalid" });
    }

    for (const item of validItems) {
      const product = await productDB.findById(item.productId._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${product.productName}`,
        });
      }
    }

    const orderData = {
      userId: user._id,
      items: validItems.map((item) => {
        const product = item.productId;
        const category = product.category;
        const productDiscount = product.discount || 0;
        const categoryDiscount = category?.discount || 0;
        const categoryName = category?.categoryName || "Uncategorized";

        return {
          productId: product._id,
          productName: product.productName,
          price: product.price,
          description: product.description || "",
          quantity: item.quantity,
          productImage: product.productImage,
          productDiscount: productDiscount,
          categoryName: categoryName,
          categoryDiscount: categoryDiscount,
          discountedPrice: product.discountedPrice,
        };
      }),
      deliveryAddress: {
        name: address.name,
        address: address.address,
        locality: address.locality,
        district: address.district,
        state: address.state,
        pincode: address.pincode,
        mobileNumber: address.mobileNumber,
      },
      totalAmount: totalAmount,
      paymentMethod: "Cash on Delivery",
    };

    const order = new orderDB(orderData);
    await order.save();

    for (const item of validItems) {
      await productDB.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await cartDB.deleteOne({ user: user._id });

    res
      .status(200)
      .json({ message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const walletPayController = async (req, res) => {
  try {
    const user = req.user;
    const { addressId } = req.body;

    const address = await addressDB.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const cart = await cartDB
      .findOne({ user: user._id })
      .populate({
        path: "items.productId",
        populate: { path: "category", model: "categoryDB" },
      })
      .exec();

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const validItems = cart.items.filter(
      (item) => item.productId && item.productId._id
    );
    if (!validItems.length) {
      return res.status(400).json({ message: "Cart contains invalid items" });
    }

    const totalAmount =
      validItems.reduce((total, item) => {
        return total + item.productId.discountedPrice * item.quantity;
      }, 0) + 50;

    if (isNaN(totalAmount)) {
      return res.status(400).json({ message: "Total amount is invalid" });
    }

    for (const item of validItems) {
      const product = await productDB.findById(item.productId._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${product.productName}`,
        });
      }
    }

    const orderData = {
      userId: user._id,
      items: validItems.map((item) => {
        const product = item.productId;
        const category = product.category;
        const productDiscount = product.discount || 0;
        const categoryDiscount = category?.discount || 0;
        const categoryName = category?.categoryName || "Uncategorized";

        return {
          productId: product._id,
          productName: product.productName,
          price: product.price,
          description: product.description || "",
          quantity: item.quantity,
          productImage: product.productImage,
          productDiscount: productDiscount,
          categoryName: categoryName,
          categoryDiscount: categoryDiscount,
          discountedPrice: product.discountedPrice,
        };
      }),
      deliveryAddress: {
        name: address.name,
        address: address.address,
        locality: address.locality,
        district: address.district,
        state: address.state,
        pincode: address.pincode,
        mobileNumber: address.mobileNumber,
      },
      totalAmount: totalAmount,
      paymentMethod: "Wallet Pay",
      paymentStatus: "Completed",
      razorpayOrderId: "wallet_payment",
    };

    const wallet = await WalletDB.findOne({ user: user._id });
    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    const order = new orderDB(orderData);
    await order.save();

    wallet.balance -= totalAmount;
    await wallet.save();

    await WalletDB.findOneAndUpdate(
      { user: user._id },
      {
        $push: {
          transactions: {
            type: "Debit",
            amount: totalAmount,
            description: "Order payment",
            timestamp: new Date(),
          },
        },
      }
    );

    for (const item of validItems) {
      await productDB.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await cartDB.deleteOne({ user: user._id });

    res
      .status(200)
      .json({ message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const user = req.user;
    const { addressId } = req.body;

    const address = await addressDB.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const cart = await cartDB
      .findOne({ user: user._id })
      .populate({
        path: "items.productId",
        populate: { path: "category", model: "categoryDB" },
      })
      .exec();

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const validItems = cart.items.filter(
      (item) => item.productId && item.productId._id
    );
    if (!validItems.length) {
      return res.status(400).json({ message: "Cart contains invalid items" });
    }

    let subtotal = validItems.reduce((total, item) => {
      return total + item.productId.discountedPrice * item.quantity;
    }, 0);

    const deliveryCharge = subtotal > 1000 ? 0 : 50;
    let totalAmount = subtotal + deliveryCharge;

    if (cart.couponApplied) {
      const couponDiscount =
        (totalAmount * cart.couponDiscountPercentage) / 100;
      totalAmount = totalAmount - couponDiscount;
    }

    if (isNaN(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ message: "Total amount is invalid" });
    }

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const orderData = {
      userId: user._id,
      items: validItems.map((item) => {
        const product = item.productId;
        const category = product.category;

        return {
          productId: product._id,
          productName: product.productName,
          price: product.price,
          quantity: item.quantity,
          discountedPrice: product.discountedPrice,
          productImage: product.productImage,
          categoryName: category?.categoryName || "Uncategorized",
          description: product.description || "",
          productDiscount: product.discount || 0,
          categoryDiscount: category?.discount || 0,
        };
      }),
      deliveryAddress: {
        name: address.name,
        address: address.address,
        locality: address.locality,
        district: address.district,
        state: address.state,
        pincode: address.pincode,
        mobileNumber: address.mobileNumber,
      },
      totalAmount,
      paymentMethod: "Razorpay",
      paymentStatus: "Failed",
      razorpayOrderId: razorpayOrder.id,
      couponApplied: cart.couponApplied,
      couponDiscountPercentage: cart.couponDiscountPercentage || 0,
    };

    const order = new orderDB(orderData);
    await order.save();

    await Promise.all(
      validItems.map(async (item) => {
        const product = await productDB.findById(item.productId);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      })
    );

    await cartDB.findOneAndDelete({ user: user._id });

    res.json({
      orderId: razorpayOrder.id,
      totalAmount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      message: "An error occurred while creating the Razorpay order.",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    const order = await orderDB.findOne({ razorpayOrderId: order_id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (generatedSignature === signature) {
      order.paymentStatus = "Completed";
      await order.save();

      res.json({ message: "Payment verified successfully." });
    } else {
      order.paymentStatus = "Failed";
      await order.save();

      res.status(400).json({ message: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({
      message: "An error occurred during payment verification.",
    });
  }
};

module.exports = {
  userCheckout,
  checkoutAddress_Get,
  checkoutAddress_Post,
  editCheckoutAddress_Get,
  editCheckoutAddress_Post,
  codController,
  walletPayController,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
