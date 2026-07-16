const mongoose = require("mongoose");

const userDeliveredOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceOrderId: { type: Number, required: true, index: true },
    sourceItemIndex: { type: Number, required: true },
    trackingCode: { type: String, required: true, trim: true, index: true },
    productId: { type: Number, required: true },
    sellerId: { type: String, required: true, trim: true, index: true },
    sellerCountry: { type: String, required: true, trim: true, lowercase: true },
    title: { type: mongoose.Schema.Types.Mixed, default: "" },
    imageUrl: { type: String, default: "" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    lineTotal: { type: Number, default: 0 },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },
    deliveredAt: { type: Date, required: true, index: true },
  },
  {
    collection: "user_delivered_orders",
    timestamps: true,
    versionKey: false,
  },
);

userDeliveredOrderSchema.index(
  { userId: 1, sourceOrderId: 1, sourceItemIndex: 1 },
  { unique: true },
);

const UserDeliveredOrder =
  mongoose.models.UserDeliveredOrder ||
  mongoose.model("UserDeliveredOrder", userDeliveredOrderSchema);

module.exports = { UserDeliveredOrder };
