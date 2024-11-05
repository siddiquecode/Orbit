const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offerType: {
      type: String,
      required: true,
      enum: ["Category", "Product"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categoryDB",
      required: function () {
        return this.offerType === "Category";
      },
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productDB",
      required: function () {
        return this.offerType === "Product";
      },
    },
    name: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("offerDB", offerSchema);
