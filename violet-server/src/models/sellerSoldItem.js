const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const SELLER_SOLD_ITEM_STATUSES = ["available", "in_process", "withdrawn", "rejected"];

const sellerSoldItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    orderId: { type: Number, required: true, index: true },
    sellerId: { type: String, required: true, trim: true, index: true },
    productId: { type: Number, required: true, index: true },
    unitIndex: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: SELLER_SOLD_ITEM_STATUSES,
      default: "available",
      index: true,
    },
    soldAt: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    paymentRequestId: { type: Number, default: null, index: true },
    rejectionComment: { type: String, default: null, trim: true },
    rejectionHistory: {
      type: [
        {
          paymentRequestId: { type: Number, default: null },
          rejectedAt: { type: Date, required: true },
          comment: { type: String, default: "", trim: true },
        },
      ],
      default: [],
    },
    withdrawnAt: { type: Date, default: null },
  },
  {
    collection: "seller_sold_items",
    timestamps: true,
    versionKey: false,
  },
);

sellerSoldItemSchema.index(
  { orderId: 1, sellerId: 1, productId: 1, unitIndex: 1 },
  { unique: true },
);
sellerSoldItemSchema.index({ sellerId: 1, status: 1, soldAt: -1 });

sellerSoldItemSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "seller_sold_item_id");
});

const SellerSoldItem =
  mongoose.models.SellerSoldItem || mongoose.model("SellerSoldItem", sellerSoldItemSchema);

module.exports = {
  SellerSoldItem,
  SELLER_SOLD_ITEM_STATUSES,
};
