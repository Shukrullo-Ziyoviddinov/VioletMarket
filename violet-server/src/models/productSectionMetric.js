const mongoose = require("mongoose");

const productSectionMetricSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, index: true },
    sectionKey: { type: String, required: true, trim: true, index: true },
    soldCount: { type: Number, required: true, default: 0, min: 0 },
    lastSoldAt: { type: Date, default: null },
  },
  {
    collection: "product_section_metrics",
    timestamps: true,
    versionKey: false,
  },
);

productSectionMetricSchema.index({ productId: 1, sectionKey: 1 }, { unique: true });

const ProductSectionMetric = mongoose.model("ProductSectionMetric", productSectionMetricSchema);

module.exports = { ProductSectionMetric };
