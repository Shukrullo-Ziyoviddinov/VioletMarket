const mongoose = require("mongoose");

const pendingReviewSchema = new mongoose.Schema(
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
      index: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true, collection: "pendingReviews" },
);

pendingReviewSchema.index({ userId: 1, status: 1, orderDate: -1 });

const PendingReview =
  mongoose.models.PendingReview ||
  mongoose.model("PendingReview", pendingReviewSchema);

module.exports = { PendingReview };
