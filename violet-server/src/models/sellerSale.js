const mongoose = require("mongoose");

const sellerSaleSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: true,
      index: true,
    },
    sellerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    weekKey: {
      type: String,
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    collection: "seller_sales",
    timestamps: true,
    versionKey: false,
  },
);

sellerSaleSchema.index({ sellerId: 1, dateKey: 1 });
sellerSaleSchema.index({ sellerId: 1, weekKey: 1 });
sellerSaleSchema.index({ sellerId: 1, monthKey: 1 });
sellerSaleSchema.index({ orderId: 1, sellerId: 1 }, { unique: true });

const SellerSale =
  mongoose.models.SellerSale || mongoose.model("SellerSale", sellerSaleSchema);

module.exports = { SellerSale };
