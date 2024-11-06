const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
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
        productName: {
          type: String,
        },
        price: {
          type: Number,
        },
        description: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        productImage: {
          type: [String],
        },
        productDiscount: {
          type: Number,
          min: 0,
          max: 100,
        },
        categoryName: {
          type: String,
        },
        categoryDiscount: {
          type: Number,
          min: 0,
          max: 100,
        },
        discountedPrice: {
          type: Number,
        },
        status: {
          type: String,
          default: "Pending",
          enum: [
            "Pending",
            "Shipped",
            "Processing",
            "Delivered",
            "Cancelled",
            "Returned",
          ],
        },
        returnReason: {
          type: String,
        },
        cancelReason: {
          type: String,
        },
      },
    ],
    orderedDate: {
      type: Date,
      default: Date.now,
    },
    returned: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Processing",
        "Completed",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
    },
    totalAmount: {
      type: Number,
    },
    deliveryAddress: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      locality: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      mobileNumber: { type: String, required: true },
    },
    razorpayOrderId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("orderDB", orderSchema);
