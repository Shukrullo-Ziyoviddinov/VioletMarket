/**
 * Xorij siller → logistica yuk so‘rovi.
 * Order item tracking: collected → ready_for_cargo (shu yozuv) → handed_to_cargo (qabul).
 */

const mongoose = require("mongoose");

const CARGO_SHIPMENT_STATUSES = [
  "pending",
  "accepted",
  /** Logistica so‘rov yuborgan — asosiy admin kutadi */
  "return_request_pending",
  /** Admin Yaroqsiz tasdiqlagan — logistica «Qaytarish» sahifasida */
  "return_approved",
  "returned_to_seller",
  "cancelled",
];

const cargoShipmentProductSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    title: { type: mongoose.Schema.Types.Mixed, default: "" },
    image: { type: String, default: "/img/no-image.png" },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },
    quantity: { type: Number, default: 1, min: 1 },
    weightKg: { type: Number, default: 0 },
    unitIndex: { type: Number, default: 0 },
  },
  { _id: false },
);

const cargoShipmentSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sellerId: { type: String, required: true, trim: true, index: true },
    sellerCountry: { type: String, required: true, trim: true, lowercase: true, index: true },
    storeName: { type: String, default: "", trim: true },
    orderId: { type: Number, required: true, index: true },
    itemIndex: { type: Number, required: true, min: 0 },
    products: { type: [cargoShipmentProductSchema], default: [] },
    productCount: { type: Number, default: 0, min: 0 },
    weightKg: { type: Number, default: 0, min: 0 },
    weightLabel: {
      type: String,
      enum: ["Taxminiy og'irlik", "Og'irlik"],
      default: "Taxminiy og'irlik",
    },
    warehouseAddress: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: CARGO_SHIPMENT_STATUSES,
      default: "pending",
      index: true,
    },
    /** Logistica ichki process — C/G da yangilanadi */
    processStep: {
      type: String,
      default: null,
      trim: true,
    },
    /** UZB kelish: og‘irlik uchun cargo yetkazish summasi (so‘m) */
    cargoDeliveryFee: { type: Number, default: 0, min: 0 },
    uzArrivalPhotoUrl: { type: String, default: "", trim: true },
    uzArrivalComment: { type: String, default: "", trim: true },
    uzArrivedAt: { type: Date, default: null },
    logisticaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticaProfile",
      default: null,
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    /** Logistica «To‘landi» — shundan keyin asosiy admin Xorij→UZB ga chiqadi */
    paidAt: { type: Date, default: null },
  },
  {
    collection: "cargo_shipments",
    timestamps: true,
    versionKey: false,
  },
);

cargoShipmentSchema.index(
  { orderId: 1, itemIndex: 1, sellerId: 1 },
  { unique: true },
);
cargoShipmentSchema.index({ status: 1, sellerCountry: 1, submittedAt: -1 });
cargoShipmentSchema.index({ status: 1, processStep: 1, paidAt: 1, logisticaId: 1 });

function toPublicCargoShipment(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    sellerId: String(row.sellerId || ""),
    sellerCountry: String(row.sellerCountry || ""),
    storeName: String(row.storeName || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    products: Array.isArray(row.products) ? row.products : [],
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: row.weightLabel || "Taxminiy og'irlik",
    warehouseAddress: String(row.warehouseAddress || ""),
    note: String(row.note || ""),
    status: String(row.status || "pending"),
    processStep: row.processStep || null,
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ""),
    uzArrivalComment: String(row.uzArrivalComment || ""),
    uzArrivedAt: row.uzArrivedAt || null,
    logisticaId: row.logisticaId ? String(row.logisticaId) : null,
    submittedAt: row.submittedAt || row.createdAt || null,
    acceptedAt: row.acceptedAt || null,
    returnedAt: row.returnedAt || null,
    paidAt: row.paidAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

const CargoShipment =
  mongoose.models.CargoShipment ||
  mongoose.model("CargoShipment", cargoShipmentSchema);

module.exports = {
  CargoShipment,
  CARGO_SHIPMENT_STATUSES,
  toPublicCargoShipment,
};
