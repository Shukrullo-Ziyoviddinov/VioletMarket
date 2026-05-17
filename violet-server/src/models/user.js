const mongoose = require("mongoose");

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
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = { User };
