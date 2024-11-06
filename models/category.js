const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
    },
    description: {
      type: String,
    },
    categoryImage: {
      type: [String],
    },
    discount: {
      type: Number,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("categoryDB", categorySchema);
