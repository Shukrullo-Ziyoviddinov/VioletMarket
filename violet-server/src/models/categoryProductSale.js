const mongoose = require("mongoose");

const categoryProductSaleSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: true,
      index: true,
    },
    productId: {
      type: Number,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    collection: "category_product_sales",
    timestamps: true,
    versionKey: false,
  },
);

categoryProductSaleSchema.index({ category: 1, dateKey: 1 });
categoryProductSaleSchema.index({ category: 1, weekKey: 1 });
categoryProductSaleSchema.index({ category: 1, monthKey: 1 });
categoryProductSaleSchema.index(
  { orderId: 1, productId: 1 },
  { unique: true },
);

const CategoryProductSale =
  mongoose.models.CategoryProductSale
  || mongoose.model("CategoryProductSale", categoryProductSaleSchema);

module.exports = { CategoryProductSale };
