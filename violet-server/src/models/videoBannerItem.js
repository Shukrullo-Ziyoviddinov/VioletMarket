const mongoose = require("mongoose");

const videoBannerItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    src: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
  },
  {
    collection: "video_banner_items",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const VideoBannerItem = mongoose.model("VideoBannerItem", videoBannerItemSchema);

module.exports = { VideoBannerItem };
