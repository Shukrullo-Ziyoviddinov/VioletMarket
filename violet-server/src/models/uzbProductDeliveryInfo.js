const mongoose = require("mongoose");

const localizedTextSchema = new mongoose.Schema(
  {
    uz: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const uzbProductDeliveryInfoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default", index: true },
    title: { type: localizedTextSchema, required: true },
    text: { type: localizedTextSchema, required: true },
  },
  {
    collection: "uzb_product_delivery_info",
    timestamps: true,
    versionKey: false,
  }
);

const UzbProductDeliveryInfo = mongoose.model(
  "UzbProductDeliveryInfo",
  uzbProductDeliveryInfoSchema
);

module.exports = { UzbProductDeliveryInfo };
