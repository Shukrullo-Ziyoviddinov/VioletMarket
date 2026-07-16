const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const adminNotificationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    paymentRequestId: { type: Number, default: null, index: true },
    requestCode: { type: String, default: "", trim: true },
    sellerId: { type: String, default: "", trim: true, index: true },
    sellerName: { type: String, default: "", trim: true },
    sellerLogoUrl: { type: String, default: "", trim: true },
    itemCount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    message: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null, index: true },
  },
  {
    collection: "admin_notifications",
    timestamps: true,
    versionKey: false,
  },
);

adminNotificationSchema.index({ createdAt: -1, id: -1 });

adminNotificationSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "admin_notification_id");
});

const AdminNotification =
  mongoose.models.AdminNotification || mongoose.model("AdminNotification", adminNotificationSchema);

module.exports = { AdminNotification };
