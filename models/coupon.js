const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
  },
  minimumAmount: {
    type: Number,
  },
  maximumAmount: {
    type: Number,
  },
  expireDate: {
    type: Date,
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDB",
    },
  ],
});

module.exports = mongoose.model("CouponDB", couponSchema);
