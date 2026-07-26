const mongoose = require("mongoose");

const logisticaAuthCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      required: true,
      enum: ["logistica-login", "logistica-register"],
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  {
    collection: "logistica_auth_codes",
    timestamps: true,
    versionKey: false,
  },
);

logisticaAuthCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });

const LogisticaAuthCode =
  mongoose.models.LogisticaAuthCode ||
  mongoose.model("LogisticaAuthCode", logisticaAuthCodeSchema);

module.exports = { LogisticaAuthCode };
