const mongoose = require("mongoose");

const LOGISTICA_COUNTRIES = ["china", "usa", "turkey", "korea", "japan"];

const logisticaProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    logisticaCountry: {
      type: String,
      required: true,
      enum: LOGISTICA_COUNTRIES,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending",
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    /** Logistica xorijdagi aloqa/ombor ma’lumotlari */
    chinaAddress: { type: String, default: "", trim: true },
    chinaPhone: { type: String, default: "", trim: true },
    profileDescription: { type: String, default: "", trim: true },
  },
  {
    collection: "logistica_profile",
    timestamps: true,
    versionKey: false,
  },
);

logisticaProfileSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    companyName: this.companyName,
    name: this.companyName,
    logisticaCountry: this.logisticaCountry,
    status: this.status,
    reviewedAt: this.reviewedAt || null,
    chinaAddress: this.chinaAddress || "",
    chinaPhone: this.chinaPhone || "",
    profileDescription: this.profileDescription || "",
    createdAt: this.createdAt || null,
  };
};

const LogisticaProfile =
  mongoose.models.LogisticaProfile ||
  mongoose.model("LogisticaProfile", logisticaProfileSchema);

module.exports = { LogisticaProfile, LOGISTICA_COUNTRIES };
