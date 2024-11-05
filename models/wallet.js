const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userDB",
    required: true,
    unique: true,
  },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: {
        type: String,
        enum: ["Credit", "Debit", "withdrawal", "processing"],
        required: true,
      },
      amount: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      description: { type: String },
    },
  ],
});

module.exports = mongoose.model("WalletDB", walletSchema);
