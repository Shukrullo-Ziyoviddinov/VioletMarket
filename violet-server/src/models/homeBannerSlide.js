const mongoose = require("mongoose");

const bannerSrcSchema = new mongoose.Schema(
  { uz: { type: String, required: true, trim: true }, ru: { type: String, required: true, trim: true } },
  { _id: false }
);

const homeBannerSlideSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    type: { type: String, enum: ["image", "video"], default: "image", trim: true },
    src: { type: bannerSrcSchema, required: true },
    clickable: { type: Boolean, default: false },
    category: { type: String, trim: true },
    countriesCategories: { type: String, trim: true },
    brandCategories: { type: String, trim: true },
  },
  {
    collection: "home_banner_slides",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const HomeBannerSlide = mongoose.model("HomeBannerSlide", homeBannerSlideSchema);

module.exports = { HomeBannerSlide };
