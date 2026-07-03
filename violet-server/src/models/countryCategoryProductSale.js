const mongoose = require("mongoose");

const countryCategoryProductSaleSchema = new mongoose.Schema(
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
    countriesCategories: {
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
    collection: "country_category_product_sales",
    timestamps: true,
    versionKey: false,
  },
);

countryCategoryProductSaleSchema.index({ countriesCategories: 1, dateKey: 1 });
countryCategoryProductSaleSchema.index({ countriesCategories: 1, weekKey: 1 });
countryCategoryProductSaleSchema.index({ countriesCategories: 1, monthKey: 1 });
countryCategoryProductSaleSchema.index(
  { orderId: 1, productId: 1 },
  { unique: true },
);

const CountryCategoryProductSale =
  mongoose.models.CountryCategoryProductSale
  || mongoose.model("CountryCategoryProductSale", countryCategoryProductSaleSchema);

module.exports = { CountryCategoryProductSale };
