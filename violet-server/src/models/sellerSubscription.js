const mongoose = require("mongoose");

const sellerSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

/** Bir foydalanuvchi bir sotuvchiga faqat bir marta obuna bo‘ladi */
sellerSubscriptionSchema.index({ userId: 1, sellerId: 1 }, { unique: true });
sellerSubscriptionSchema.index({ sellerId: 1 });

const SellerSubscription =
  mongoose.models.SellerSubscription ||
  mongoose.model("SellerSubscription", sellerSubscriptionSchema);

module.exports = { SellerSubscription };
