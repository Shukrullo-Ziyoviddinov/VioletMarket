const mongoose = require("mongoose");

const sellerRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    emailVerified: { type: Boolean, default: false },
    shopDisplayName: { type: String, trim: true, default: "" },
    shopId: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },
    passwordHash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String, default: "", trim: true },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  {
    collection: "seller_registrations",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

const SellerRegistration = mongoose.model("SellerRegistration", sellerRegistrationSchema);

function toPublicJSON(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    emailVerified: Boolean(doc.emailVerified),
    shopDisplayName: doc.shopDisplayName || "",
    shopId: doc.shopId || "",
    status: doc.status,
    rejectionReason: doc.rejectionReason || "",
    submittedAt: doc.submittedAt || null,
    reviewedAt: doc.reviewedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = { SellerRegistration, toPublicJSON };
