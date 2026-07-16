const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const sellerNotificationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    sellerId: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    paymentRequestId: { type: Number, default: null, index: true },
    requestCode: { type: String, default: "", trim: true },
    productLabel: { type: String, default: "", trim: true },
    itemCount: { type: Number, default: 0 },
    status: { type: String, enum: ["approved", "rejected"], default: null },
    message: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null, index: true },
  },
  {
    collection: "seller_notifications",
    timestamps: true,
    versionKey: false,
  },
);

sellerNotificationSchema.index({ sellerId: 1, createdAt: -1, id: -1 });

sellerNotificationSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "seller_notification_id");
});

const SellerNotification =
  mongoose.models.SellerNotification || mongoose.model("SellerNotification", sellerNotificationSchema);

module.exports = { SellerNotification };
