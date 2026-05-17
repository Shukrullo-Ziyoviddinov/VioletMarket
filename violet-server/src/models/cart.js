const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },
    title: { type: mongoose.Schema.Types.Mixed, default: "" },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    image: { type: String, default: "/img/no-image.png" },
    countries: { type: [String], default: [] },
    weight: { type: Number, default: 300 },
  },
  { timestamps: true, collection: "cart" },
);

cartItemSchema.index(
  { userId: 1, productId: 1, color: 1, size: 1, storage: 1, model: 1 },
  { unique: true },
);

const CartItem =
  mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);

module.exports = { CartItem };
