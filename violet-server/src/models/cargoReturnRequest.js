const mongoose = require("mongoose");

/**
 * Logistica «Sotuvchiga qaytarish» — asosiy admin tasdiqlamaguncha yakunlanmaydi.
 * Kuryer Ajdaniya (CourierReturnRequest) dan alohida — assignment/delivery talab qilmaydi.
 */
const cargoReturnRequestSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoShipment",
      required: true,
      index: true,
    },
    requestCode: { type: String, default: "", trim: true, index: true },
    orderId: { type: Number, required: true, index: true },
    itemIndex: { type: Number, required: true },
    unitIndex: { type: Number, required: true, default: 0 },
    productId: { type: Number, required: true, index: true },
    productCode: { type: String, default: "" },
    sellerId: { type: String, required: true, index: true },
    storeName: { type: String, default: "" },
    cargoCountry: { type: String, default: "", trim: true, lowercase: true, index: true },
    title: {
      uz: { type: String, default: "" },
      ru: { type: String, default: "" },
    },
    amount: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    imageUrl: { type: String, default: "" },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },

    logisticaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticaProfile",
      required: true,
      index: true,
    },
    logistica: {
      companyName: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    comment: { type: String, default: "" },
    /** Hozircha faqat defective (Yaroqsiz). Imkonsiz keyinroq. */
    approvedReasonType: {
      type: String,
      enum: ["defective"],
      default: undefined,
    },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    rejectReason: { type: String, default: "" },
    /** Rad etilganda shipment holatini tiklash uchun */
    previousShipmentStatus: {
      type: String,
      enum: ["pending", "accepted"],
      required: true,
    },

    isPaid: { type: Boolean, default: false },
    orderPaymentStatus: { type: String, default: "" },
    orderedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    returnedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourierReturnedOrder",
      default: null,
    },
  },
  {
    collection: "cargo_return_requests",
    timestamps: true,
    versionKey: false,
  },
);

cargoReturnRequestSchema.index({ status: 1, createdAt: -1 });
cargoReturnRequestSchema.index(
  { shipmentId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);
cargoReturnRequestSchema.index({ logisticaId: 1, status: 1, reviewedAt: -1 });

const CargoReturnRequest =
  mongoose.models.CargoReturnRequest ||
  mongoose.model("CargoReturnRequest", cargoReturnRequestSchema);

module.exports = { CargoReturnRequest };
