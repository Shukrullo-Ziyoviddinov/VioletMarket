const mongoose = require("mongoose");

const savedDeliveryAddressSchema = new mongoose.Schema(
  {
    region: { type: String, default: "", trim: true },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    coords: { type: [Number], default: undefined },
    placeType: { type: String, default: "" },
    entrance: { type: String, default: "" },
    floor: { type: String, default: "" },
    domofon: { type: String, default: "" },
    courierNote: { type: String, default: "" },
    formatted: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    birthDate: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", ""], default: "" },
    profileImage: { type: String, default: "" },
    hasUploadedImage: { type: Boolean, default: false },
    language: { type: String, default: "uz" },
    sellerAccountId: { type: String, default: null },
    savedDeliveryAddress: {
      type: savedDeliveryAddressSchema,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    birthDate: this.birthDate,
    gender: this.gender,
    profileImage: this.profileImage,
    hasUploadedImage: this.hasUploadedImage,
    language: this.language,
    sellerAccountId: this.sellerAccountId,
    savedDeliveryAddress: this.savedDeliveryAddress || null,
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = { User };
