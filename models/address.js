const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDB",
      required: true,
    },
    name: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    pincode: {
      type: String,
    },
    locality: {
      type: String,
    },
    address: {
      type: String,
    },
    district: {
      type: String,
    },
    state: {
      type: String,
    },

    landmark: String,
    alternateMobile: String,
    type: {
      type: String,
      enum: ["home", "work"],
      default: "home",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("addressDB", addressSchema);
