const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const footerContactLinkSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
  },
  {
    collection: "footer_contact_links",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

footerContactLinkSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "footer_contact_link_id");
});

const FooterContactLink = mongoose.model("FooterContactLink", footerContactLinkSchema);

module.exports = { FooterContactLink };
