const mongoose = require("mongoose");

const brandCategorySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    filterValue: { type: String, required: true, trim: true },
  },
  {
    collection: "brand_categories",
    timestamps: true,
    versionKey: false,
  }
);

const BrandCategory = mongoose.model("BrandCategory", brandCategorySchema);

module.exports = { BrandCategory };
