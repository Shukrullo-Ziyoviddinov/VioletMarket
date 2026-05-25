const mongoose = require("mongoose");

const flashSaleRuleConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true, default: "default" },
    minSoldCount: { type: Number, required: true, default: 5, min: 0 },
    minCartUsers: { type: Number, required: true, default: 5, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 15, min: 0 },
    highStockThreshold: { type: Number, required: true, default: 20, min: 0 },
    rotateEveryMs: { type: Number, required: true, default: 5000, min: 1000 },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: "flash_sale_rule_configs",
    timestamps: true,
    versionKey: false,
  },
);

const FlashSaleRuleConfig = mongoose.model("FlashSaleRuleConfig", flashSaleRuleConfigSchema);

module.exports = { FlashSaleRuleConfig };
