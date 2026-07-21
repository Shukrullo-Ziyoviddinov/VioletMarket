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
    sellerCountry: { type: String, required: true, trim: true, lowercase: true, index: true },
    logo: { type: String, required: true, trim: true },
    /** UI da ko‘rinadigan manzil matni */
    address: { type: String, default: "", trim: true },
    /** Kuryer uchun sotuvchi telefoni */
    sellerPhone: { type: String, default: "", trim: true },
    /** [lat, lng] — do‘kon turgan joy koordinatasi */
    coordinates: {
      type: [Number],
      default: undefined,
      validate: {
        validator(value) {
          if (value == null) return true;
          if (!Array.isArray(value) || value.length < 2) return false;
          const lat = Number(value[0]);
          const lng = Number(value[1]);
          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          );
        },
        message: "coordinates [lat, lng] formatida bo‘lishi kerak",
      },
    },
    subscriberCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
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
