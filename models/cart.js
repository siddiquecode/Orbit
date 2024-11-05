const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDB",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productDB",
          required: true,
        },
        quantity: {
          type: Number,
        },
      },
    ],
    couponApplied: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
    },
    totalDiscount: {
      type: Number,
    },
    balance: {
      type: Number,
    },
    couponDiscountPercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("cartDB", cartSchema);
