const mongoose = require("mongoose");

/** toshkent | viloyat va hokazo — butun blok `data` ichida */
const deliveryRegionPriceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    sortOrder: { type: Number, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    collection: "delivery_region_prices",
    timestamps: true,
    versionKey: false,
  }
);

const DeliveryRegionPrice = mongoose.model("DeliveryRegionPrice", deliveryRegionPriceSchema);

module.exports = { DeliveryRegionPrice };
