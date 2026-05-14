const mongoose = require("mongoose");

const i18nPairSchema = new mongoose.Schema(
  { uz: { type: String, required: true, trim: true }, ru: { type: String, required: true, trim: true } },
  { _id: false }
);

const navbarItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: i18nPairSchema, required: true },
    image: { type: String, default: "", trim: true },
    description: { type: i18nPairSchema, required: true },
  },
  { _id: false }
);

const navbarSectionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: i18nPairSchema, required: true },
    items: { type: [navbarItemSchema], default: [] },
  },
  {
    collection: "navbar_sections",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const NavbarSection = mongoose.model("NavbarSection", navbarSectionSchema);

module.exports = { NavbarSection };
