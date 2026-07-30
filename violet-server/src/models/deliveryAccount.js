const mongoose = require("mongoose");
const { DELIVERY_REGIONS } = require("../constants/deliveryRegions");

const deliveryAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "", trim: true },
    transport: {
      type: String,
      enum: ["car", "scooter", "bicycle"],
      default: null,
    },
    region: {
      type: String,
      default: "",
      trim: true,
      index: true,
      validate: {
        validator(value) {
          if (!value) return true;
          return DELIVERY_REGIONS.includes(value);
        },
        message: "Viloyat noto‘g‘ri",
      },
    },
    isOnline: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending",
      index: true,
    },
    reviewedAt: { type: Date, default: null },
  },
  {
    collection: "delivery_accounts",
    timestamps: true,
    versionKey: false,
  },
);

deliveryAccountSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    profileImage: this.profileImage,
    transport: this.transport || null,
    region: this.region || "",
    isOnline: this.isOnline,
    status: this.status,
    reviewedAt: this.reviewedAt || null,
    createdAt: this.createdAt || null,
  };
};

const DeliveryAccount =
  mongoose.models.DeliveryAccount ||
  mongoose.model("DeliveryAccount", deliveryAccountSchema);

module.exports = { DeliveryAccount };
