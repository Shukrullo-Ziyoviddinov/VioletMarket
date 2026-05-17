const mongoose = require("mongoose");

const flashSaleCountdownSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    durationHours: {
      type: Number,
      required: true,
      min: 0.01,
    },
    cycleEndsAt: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "flash_sale_countdown",
    timestamps: true,
  },
);

const FlashSaleCountdown =
  mongoose.models.FlashSaleCountdown ||
  mongoose.model("FlashSaleCountdown", flashSaleCountdownSchema);

module.exports = { FlashSaleCountdown };
