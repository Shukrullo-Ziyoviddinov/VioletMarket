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
    liveMinViewers: { type: Number, required: true, default: 50, min: 1 },
    liveMaxViewers: { type: Number, required: true, default: 1000, min: 1 },
    liveUpdateEveryMs: { type: Number, required: true, default: 1000, min: 250 },
    liveModeRotateEveryMs: { type: Number, required: true, default: 7000, min: 1000 },
    liveNormalStepMin: { type: Number, required: true, default: 5, min: 1 },
    liveNormalStepMax: { type: Number, required: true, default: 40, min: 1 },
    liveSurgeStepMin: { type: Number, required: true, default: 35, min: 1 },
    liveSurgeStepMax: { type: Number, required: true, default: 140, min: 1 },
    liveCooldownStepMin: { type: Number, required: true, default: 35, min: 1 },
    liveCooldownStepMax: { type: Number, required: true, default: 140, min: 1 },
    liveSpikeChancePercent: { type: Number, required: true, default: 18, min: 0, max: 100 },
  },
  {
    collection: "flash_sale_rule_configs",
    timestamps: true,
    versionKey: false,
  },
);

const FlashSaleRuleConfig = mongoose.model("FlashSaleRuleConfig", flashSaleRuleConfigSchema);

module.exports = { FlashSaleRuleConfig };
