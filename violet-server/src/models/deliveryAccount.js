const mongoose = require("mongoose");

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
    isOnline: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
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
    isOnline: this.isOnline,
    status: this.status,
  };
};

const DeliveryAccount =
  mongoose.models.DeliveryAccount ||
  mongoose.model("DeliveryAccount", deliveryAccountSchema);

module.exports = { DeliveryAccount };
