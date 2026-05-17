const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

/** Bir user bir mahsulotni faqat bir marta saqlaydi */
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

module.exports = { Wishlist };
