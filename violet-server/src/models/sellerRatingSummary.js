const mongoose = require("mongoose");

const sellerRatingSummarySchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, unique: true, trim: true, index: true },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingSum: { type: Number, default: 0, min: 0 },
    star1: { type: Number, default: 0, min: 0 },
    star2: { type: Number, default: 0, min: 0 },
    star3: { type: Number, default: 0, min: 0 },
    star4: { type: Number, default: 0, min: 0 },
    star5: { type: Number, default: 0, min: 0 },
  },
  {
    collection: "seller_rating_summaries",
    timestamps: true,
    versionKey: false,
    id: false,
  },
);

const SellerRatingSummary =
  mongoose.models.SellerRatingSummary ||
  mongoose.model("SellerRatingSummary", sellerRatingSummarySchema);

module.exports = { SellerRatingSummary };
