const mongoose = require("mongoose");

/**
 * Mijozga pul qaytarish so‘rovlari.
 * Ombor/qaytarish zanjiridan alohida:
 *   - to‘langan return|defective (kuryer/cargo)
 *   - to‘langan seller_unavailable (siller «Mavjud emas»)
 */
const customerRefundRequestSchema = new mongoose.Schema(
  {
    returnedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourierReturnedOrder",
      required: false,
      // seller_unavailable da maydon yo‘q — partial unique index (pastda)
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourierOrderAssignment",
      default: null,
      index: true,
    },
    orderId: { type: Number, required: true, index: true },
    itemIndex: { type: Number, required: true },
    unitIndex: { type: Number, required: true, default: 0 },
    productId: { type: Number, required: true, index: true },
    productCode: { type: String, default: "" },
    sellerId: { type: String, required: true, index: true },
    title: {
      uz: { type: String, default: "" },
      ru: { type: String, default: "" },
    },
    amount: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    imageUrl: { type: String, default: "" },
    reasonType: {
      type: String,
      enum: ["return", "defective", "unavailable"],
      required: true,
      index: true,
    },
    customer: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    courier: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    /**
     * courier — UZB kuryer qaytarishi.
     * cargo — xorij logistica sillerga qaytargan.
     * seller_unavailable — siller/admin «Mavjud emas» (ombor qty qaytmaydi).
     */
    source: {
      type: String,
      enum: ["courier", "cargo", "seller_unavailable"],
      default: "courier",
      index: true,
    },
    cargoCountry: { type: String, default: "", trim: true, lowercase: true },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoShipment",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "refunded"],
      default: "pending",
      index: true,
    },
    returnedAt: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    refundedAt: { type: Date, default: null, index: true },
    refundedBy: { type: String, default: "" },
  },
  {
    collection: "customer_refund_requests",
    timestamps: true,
    versionKey: false,
  },
);

customerRefundRequestSchema.index({ status: 1, returnedAt: -1 });
customerRefundRequestSchema.index({ sellerId: 1, status: 1, returnedAt: -1 });
customerRefundRequestSchema.index(
  { orderId: 1, itemIndex: 1, unitIndex: 1 },
  { unique: true },
);
// Faqat haqiqiy returnedOrderId bo‘lganda unique — null/yo‘q maydonlar cheklanmaydi
customerRefundRequestSchema.index(
  { returnedOrderId: 1 },
  {
    unique: true,
    name: "returnedOrderId_partial_unique",
    partialFilterExpression: {
      returnedOrderId: { $exists: true, $type: "objectId" },
    },
  },
);

const CustomerRefundRequest =
  mongoose.models.CustomerRefundRequest ||
  mongoose.model("CustomerRefundRequest", customerRefundRequestSchema);

module.exports = { CustomerRefundRequest };
