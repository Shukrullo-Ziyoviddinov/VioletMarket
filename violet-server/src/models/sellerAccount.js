const mongoose = require("mongoose");

const i18nPairSchema = new mongoose.Schema(
  { uz: { type: String, required: true, trim: true }, ru: { type: String, required: true, trim: true } },
  { _id: false }
);

const sellerAccountSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: i18nPairSchema, required: true },
    description: {
      uz: { type: String, default: "", trim: true },
      ru: { type: String, default: "", trim: true },
    },
    logo: { type: String, required: true, trim: true },
    subscriberCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
      index: true,
    },
  },
  {
    collection: "seller_accounts",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const SellerAccount = mongoose.model("SellerAccount", sellerAccountSchema);

module.exports = { SellerAccount };
