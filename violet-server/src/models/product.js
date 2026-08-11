// @ts-nocheck

/**
 * products collection — strict: false.
 * Qo'shimcha maydonlar (hujjatga yoziladi):
 * - approvalStatus: pending | approved | rejected | (yo'q = eski live)
 * - cargoExpressPolicy: unrestricted | standard_only | null
 * - clientActive, pausedBySeller, reviewedAt
 */

const mongoose = require("mongoose");
const { Counter } = require("./counter");
const {
  normalizeProductStockShape,
  validateProductStockRules,
} = require("../utils/productStockRules");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
});

productSchema.options.strict = false;
productSchema.options.collection = "products";
productSchema.options.timestamps = false;
productSchema.options.versionKey = false;
productSchema.options.id = false;

productSchema.pre("validate", async function autoAssignProductId() {
  if (Number.isFinite(Number(this.id))) return;

  const row = await Counter.findOneAndUpdate(
    { key: "product_id" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  this.id = Number(row?.seq || 0);
});

productSchema.pre("validate", function enforceStockStructure() {
  const stockShapeIssues = normalizeProductStockShape(this);
  for (const issuePath of stockShapeIssues) {
    this.invalidate(
      issuePath,
      "Stock map formati noto'g'ri. Har bir entry { quantity, price, originalPrice } ko'rinishida bo'lishi kerak.",
    );
  }

  const ruleErrors = validateProductStockRules(this);
  for (const message of ruleErrors) {
    this.invalidate("quantity", message);
  }
});

const productModel = mongoose.model("Product", productSchema);

module.exports = { Product: productModel };
