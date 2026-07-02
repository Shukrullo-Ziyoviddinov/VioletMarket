const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    sellerId: { type: String, default: "" },
    title: { type: mongoose.Schema.Types.Mixed, default: "" },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    lineTotal: { type: Number, default: 0 },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },
    image: { type: String, default: "/img/no-image.png" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "mock" },
    status: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "paid",
      index: true,
    },
    paidAt: { type: Date, default: null, index: true },
    source: {
      type: String,
      enum: ["checkout", "delivery-admin"],
      default: "checkout",
    },
  },
  {
    collection: "orders",
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, paidAt: -1 });
orderSchema.index({ "items.sellerId": 1, paidAt: -1 });

orderSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "order_id");
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = { Order };
