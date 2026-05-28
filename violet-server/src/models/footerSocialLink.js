const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

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

footerSocialLinkSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "footer_social_link_id");
});

const FooterSocialLink = mongoose.model("FooterSocialLink", footerSocialLinkSchema);

module.exports = { FooterSocialLink };
