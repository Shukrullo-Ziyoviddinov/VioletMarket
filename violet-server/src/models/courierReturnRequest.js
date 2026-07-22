const mongoose = require("mongoose");

/**
 * Kuryer Ajdaniya so‘rovi — asosiy admin tasdiqlamaguncha qaytarish yakunlanmaydi.
 */
const courierReturnRequestSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourierOrderAssignment",
      required: true,
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
    imageUrl: { type: String, default: "" },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAccount",
      required: true,
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

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    comment: { type: String, default: "" },
    approvedReasonType: {
      type: String,
      enum: ["no_answer", "return"],
      default: undefined,
    },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    rejectReason: { type: String, default: "" },

    isPaid: { type: Boolean, default: false },
    orderPaymentStatus: { type: String, default: "" },
    orderedAt: { type: Date, default: null },
  },
  {
    collection: "courier_return_requests",
    timestamps: true,
    versionKey: false,
  },
);

courierReturnRequestSchema.index({ status: 1, createdAt: -1 });
courierReturnRequestSchema.index(
  { assignmentId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const CourierReturnRequest =
  mongoose.models.CourierReturnRequest ||
  mongoose.model("CourierReturnRequest", courierReturnRequestSchema);

module.exports = { CourierReturnRequest };
