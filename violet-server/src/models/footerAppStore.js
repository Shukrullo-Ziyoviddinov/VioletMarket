const mongoose = require("mongoose");

const footerAppStoreSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
  },
  {
    collection: "footer_app_stores",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const FooterAppStore = mongoose.model("FooterAppStore", footerAppStoreSchema);

module.exports = { FooterAppStore };
