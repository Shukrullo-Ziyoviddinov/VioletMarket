const mongoose = require("mongoose");

const i18nPairSchema = new mongoose.Schema(
  { uz: { type: String, required: true, trim: true }, ru: { type: String, required: true, trim: true } },
  { _id: false }
);

const footerAboutItemSchema = new mongoose.Schema(
  { text: { type: i18nPairSchema, required: true } },
  { _id: false }
);

const footerAboutSectionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: i18nPairSchema, required: true },
    items: { type: [footerAboutItemSchema], default: [] },
  },
  {
    collection: "footer_about_sections",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const FooterAboutSection = mongoose.model("FooterAboutSection", footerAboutSectionSchema);

module.exports = { FooterAboutSection };
