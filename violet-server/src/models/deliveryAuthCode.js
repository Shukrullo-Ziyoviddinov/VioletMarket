const mongoose = require("mongoose");

const deliveryAuthCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      required: true,
      enum: ["delivery-login", "delivery-register"],
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  {
    collection: "delivery_auth_codes",
    timestamps: true,
    versionKey: false,
  },
);

deliveryAuthCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });

const DeliveryAuthCode =
  mongoose.models.DeliveryAuthCode ||
  mongoose.model("DeliveryAuthCode", deliveryAuthCodeSchema);

module.exports = { DeliveryAuthCode };
