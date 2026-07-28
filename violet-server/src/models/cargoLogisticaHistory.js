const mongoose = require("mongoose");

/**
 * Logistica Tarix — To‘landi (topshirilgan) va sillerga qaytarilgan.
 * CargoShipment / return zanjiridan alohida arxiv; happy pathga aralashmaydi.
 */
const CARGO_HISTORY_KINDS = ["handed_over", "returned"];

const cargoLogisticaHistorySchema = new mongoose.Schema(
  {
    logisticaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticaProfile",
      required: true,
      index: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoShipment",
      required: true,
      index: true,
    },
    /** handed_over = To‘landi / topshirildi; returned = sillerga qaytarilgan */
    kind: {
      type: String,
      enum: CARGO_HISTORY_KINDS,
      required: true,
      index: true,
    },
    requestCode: { type: String, default: "", trim: true },
    storeName: { type: String, default: "", trim: true },
    sellerId: { type: String, default: "", trim: true, index: true },
    orderId: { type: Number, default: 0, index: true },
    itemIndex: { type: Number, default: 0 },
    productTitle: { type: String, default: "" },
    productCode: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    cargoCountry: { type: String, default: "", trim: true, lowercase: true },
    cargoReturnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoReturnRequest",
      default: null,
    },
    at: { type: Date, required: true, index: true },
  },
  {
    collection: "cargo_logistica_history",
    timestamps: true,
    versionKey: false,
  },
);

cargoLogisticaHistorySchema.index(
  { shipmentId: 1, kind: 1 },
  { unique: true },
);
cargoLogisticaHistorySchema.index({ logisticaId: 1, at: -1 });

const CargoLogisticaHistory =
  mongoose.models.CargoLogisticaHistory ||
  mongoose.model("CargoLogisticaHistory", cargoLogisticaHistorySchema);

module.exports = {
  CargoLogisticaHistory,
  CARGO_HISTORY_KINDS,
};
