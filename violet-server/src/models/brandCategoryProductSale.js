const mongoose = require("mongoose");

const brandCategoryProductSaleSchema = new mongoose.Schema(
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
    brandCategories: {
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
    collection: "brand_category_product_sales",
    timestamps: true,
    versionKey: false,
  },
);

brandCategoryProductSaleSchema.index({ brandCategories: 1, dateKey: 1 });
brandCategoryProductSaleSchema.index({ brandCategories: 1, weekKey: 1 });
brandCategoryProductSaleSchema.index({ brandCategories: 1, monthKey: 1 });
brandCategoryProductSaleSchema.index(
  { orderId: 1, productId: 1 },
  { unique: true },
);

const BrandCategoryProductSale =
  mongoose.models.BrandCategoryProductSale
  || mongoose.model("BrandCategoryProductSale", brandCategoryProductSaleSchema);

module.exports = { BrandCategoryProductSale };
