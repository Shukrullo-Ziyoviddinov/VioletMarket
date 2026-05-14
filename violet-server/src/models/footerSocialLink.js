const mongoose = require("mongoose");

const footerSocialLinkSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
  },
  {
    collection: "footer_social_links",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const FooterSocialLink = mongoose.model("FooterSocialLink", footerSocialLinkSchema);

module.exports = { FooterSocialLink };
