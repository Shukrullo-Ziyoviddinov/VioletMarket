const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const PAYMENT_REQUEST_STATUSES = ["in_process", "withdrawn", "rejected"];

const sellerPaymentRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    sellerId: { type: String, required: true, trim: true, index: true },
    requestCode: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: PAYMENT_REQUEST_STATUSES,
      default: "in_process",
      index: true,
    },
    totalAmount: { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
    submittedAt: { type: Date, required: true, index: true },
    reviewedAt: { type: Date, default: null },
    rejectionComment: { type: String, default: null, trim: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
  },
  {
    collection: "seller_payment_requests",
    timestamps: true,
    versionKey: false,
  },
);

sellerPaymentRequestSchema.index({ sellerId: 1, submittedAt: -1 });
sellerPaymentRequestSchema.index({ status: 1, submittedAt: -1 });

sellerPaymentRequestSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "seller_payment_request_id");
});

const SellerPaymentRequest =
  mongoose.models.SellerPaymentRequest
  || mongoose.model("SellerPaymentRequest", sellerPaymentRequestSchema);

module.exports = {
  SellerPaymentRequest,
  PAYMENT_REQUEST_STATUSES,
};
