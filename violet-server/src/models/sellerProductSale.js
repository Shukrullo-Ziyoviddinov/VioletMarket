const mongoose = require("mongoose");

const sellerProductSaleSchema = new mongoose.Schema(
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
    productId: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    image: {
      type: String,
      default: "/img/no-image.png",
    },
    price: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    amount: {
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
    collection: "seller_product_sales",
    timestamps: true,
    versionKey: false,
  },
);

sellerProductSaleSchema.index({ sellerId: 1, productId: 1, dateKey: 1 });
sellerProductSaleSchema.index({ sellerId: 1, productId: 1, weekKey: 1 });
sellerProductSaleSchema.index({ sellerId: 1, productId: 1, monthKey: 1 });
sellerProductSaleSchema.index(
  { orderId: 1, sellerId: 1, productId: 1 },
  { unique: true },
);

const SellerProductSale =
  mongoose.models.SellerProductSale
  || mongoose.model("SellerProductSale", sellerProductSaleSchema);

module.exports = { SellerProductSale };
