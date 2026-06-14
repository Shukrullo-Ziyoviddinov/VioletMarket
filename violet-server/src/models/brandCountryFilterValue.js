const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const brandCountryFilterValueSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    type: { type: String, required: true, enum: ["brand", "country"], trim: true },
    filterValue: { type: String, required: true, trim: true },
  },
  {
    collection: "brand_country_filter_values",
    timestamps: true,
    versionKey: false,
  }
);

brandCountryFilterValueSchema.index({ type: 1, filterValue: 1 }, { unique: true });

brandCountryFilterValueSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "brand_country_filter_value_id");
});

const BrandCountryFilterValue = mongoose.model(
  "BrandCountryFilterValue",
  brandCountryFilterValueSchema
);

module.exports = { BrandCountryFilterValue };
