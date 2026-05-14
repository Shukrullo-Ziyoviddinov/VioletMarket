const mongoose = require("mongoose");

/** Har bir mamlakat/kalit bo'yicha bitta hujjat; `data` — { name, standard?, express?, infoCargo? } */
const cargoRegionRateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    sortOrder: { type: Number, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    collection: "cargo_region_rates",
    timestamps: true,
    versionKey: false,
  }
);

const CargoRegionRate = mongoose.model("CargoRegionRate", cargoRegionRateSchema);

module.exports = { CargoRegionRate };
