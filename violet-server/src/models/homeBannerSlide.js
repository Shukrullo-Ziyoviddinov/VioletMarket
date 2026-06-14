const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

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
    masterCategoryId: { type: Number, index: true },
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

homeBannerSlideSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "home_banner_slide_id");
});

const HomeBannerSlide = mongoose.model("HomeBannerSlide", homeBannerSlideSchema);

module.exports = { HomeBannerSlide };
