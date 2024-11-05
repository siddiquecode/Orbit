const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
    },
    price: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categoryDB",
    },
    productImage: {
      type: [String],
    },
    description: {
      type: String,
    },
    discount: {
      type: Number,
    },
    stock: {
      type: Number,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual to calculate discounted price
productSchema.virtual("discountedPrice").get(function () {
  const productDiscount = this.discount || 0;
  const categoryDiscount = this.category?.discount || 0;

  const productDiscountedPrice =
    this.price - (this.price * productDiscount) / 100;
  const categoryDiscountedPrice =
    this.price - (this.price * categoryDiscount) / 100;

  return Math.min(productDiscountedPrice, categoryDiscountedPrice);
});

module.exports = mongoose.model("productDB", productSchema);
