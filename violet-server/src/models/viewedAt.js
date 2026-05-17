const mongoose = require("mongoose");

const viewedAtSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    price: {
      type: Number,
      default: 0,
    },
    viewedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { collection: "viewedAt" },
);

viewedAtSchema.index({ userId: 1, productId: 1 }, { unique: true });
viewedAtSchema.index({ userId: 1, viewedAt: -1 });

const ViewedAt =
  mongoose.models.ViewedAt || mongoose.model("ViewedAt", viewedAtSchema);

module.exports = { ViewedAt };
