const mongoose = require("mongoose");

/**
 * Kuryer qaytargan / javob bermagan mahsulotlar — alohida collection.
 * Siller admin "Qaytarilgan buyurtma" sahifasi shu yerdan o‘qiydi.
 */
const courierReturnedOrderSchema = new mongoose.Schema(
  {
    /**
     * Kuryer qaytarishi — majburiy.
     * Cargo (logistica) qaytarishi — bo‘sh (source=cargo).
     */
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourierOrderAssignment",
      required: false,
      default: undefined,
      index: true,
    },
    source: {
      type: String,
      enum: ["courier", "cargo"],
      default: "courier",
      index: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoShipment",
      default: null,
      index: true,
    },
    cargoReturnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoReturnRequest",
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
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAccount",
      required: false,
      default: undefined,
      index: true,
    },
    courier: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    customer: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    reasonType: {
      type: String,
      enum: ["no_answer", "return", "defective"],
      required: true,
      index: true,
    },
    comment: { type: String, default: "" },

    orderedAt: { type: Date, default: null, index: true },
    returnedAt: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },

    orderPaymentStatus: { type: String, default: "" },
    isPaid: { type: Boolean, default: false },

    /**
     * true = ombor ochilgan (quantity qaytgan).
     * no_answer da kuryer qaytarganda false — faqat «Qayta aktiv qilish»da true bo‘ladi.
     * defective da har doim false (omborga qaytmaydi).
     */
    stockReleased: { type: Boolean, default: false, index: true },

    /**
     * true = Yaroqsiz — reserved yechilgan, ombor/algoritmga tegilmagan.
     */
    stockDiscarded: { type: Boolean, default: false, index: true },

    /** Admin/siller tugmalari: re_handoff | reactivated | delivered */
    resolutionType: {
      type: String,
      enum: ["re_handoff", "reactivated", "delivered"],
      default: undefined,
    },
    resolvedAt: { type: Date, default: null, index: true },
    resolvedBy: { type: String, default: "" },
  },
  {
    collection: "courier_returned_orders",
    timestamps: true,
    versionKey: false,
  },
);

courierReturnedOrderSchema.index({ sellerId: 1, returnedAt: -1 });
courierReturnedOrderSchema.index({ sellerId: 1, dateKey: 1 });
courierReturnedOrderSchema.index({ sellerId: 1, weekKey: 1 });
courierReturnedOrderSchema.index({ sellerId: 1, monthKey: 1 });
courierReturnedOrderSchema.index({ sellerId: 1, reasonType: 1, resolvedAt: 1 });
courierReturnedOrderSchema.index({ reasonType: 1, resolvedAt: 1 });
courierReturnedOrderSchema.index(
  { assignmentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      assignmentId: { $type: "objectId" },
    },
  },
);
courierReturnedOrderSchema.index(
  { orderId: 1, itemIndex: 1, unitIndex: 1 },
  { unique: true },
);

const CourierReturnedOrder =
  mongoose.models.CourierReturnedOrder ||
  mongoose.model("CourierReturnedOrder", courierReturnedOrderSchema);

module.exports = { CourierReturnedOrder };
