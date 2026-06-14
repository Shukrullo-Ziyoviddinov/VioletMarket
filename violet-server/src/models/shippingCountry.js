const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const shippingCountryNameSchema = new mongoose.Schema(
  {
    uz: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shippingCountrySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: shippingCountryNameSchema, required: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    collection: "shipping_country",
    timestamps: true,
    versionKey: false,
  }
);

shippingCountrySchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "shipping_country_id");
});

const ShippingCountry = mongoose.model("ShippingCountry", shippingCountrySchema);

module.exports = { ShippingCountry };
