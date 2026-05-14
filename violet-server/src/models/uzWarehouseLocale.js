const mongoose = require("mongoose");

const uzSrcSchema = new mongoose.Schema(
  {
    uz: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** Hozircha bitta blok (id=1); keyinroq bir nechta qator qo'shish mumkin */
const uzWarehouseLocaleSchema = new mongoose.Schema(
  {
    slot: { type: Number, required: true, unique: true, index: true, default: 1 },
    src: { type: uzSrcSchema, required: true },
  },
  {
    collection: "uz_warehouse_locales",
    timestamps: true,
    versionKey: false,
  }
);

const UzWarehouseLocale = mongoose.model("UzWarehouseLocale", uzWarehouseLocaleSchema);

module.exports = { UzWarehouseLocale };
