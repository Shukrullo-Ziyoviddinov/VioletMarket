const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    isTest: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "comments" },
);

commentSchema.index({ productId: 1, createdAt: -1 });

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

module.exports = { Comment };
