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
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },

    landmark: String,
    alternateMobile: String,
    type: {
      type: String,
      enum: ["home", "work"],
      default: "home",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("addressDB", addressSchema);
