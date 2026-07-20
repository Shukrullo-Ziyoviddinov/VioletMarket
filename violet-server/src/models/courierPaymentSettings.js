const mongoose = require("mongoose");

const tierSchema = new mongoose.Schema(
  {
    minKm: { type: Number, required: true, default: 0 },
    maxKm: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const DEFAULT_TIERS = [
  { minKm: 1, maxKm: 5, amount: 15000 },
  { minKm: 5, maxKm: 10, amount: 25000 },
  { minKm: 10, maxKm: 20, amount: 35000 },
  { minKm: 20, maxKm: 30, amount: 45000 },
  { minKm: 30, maxKm: 40, amount: 55000 },
];

const courierPaymentSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    tiers: { type: [tierSchema], default: () => DEFAULT_TIERS },
  },
  {
    collection: "courier_payment_settings",
    timestamps: true,
    versionKey: false,
  },
);

const CourierPaymentSettings =
  mongoose.models.CourierPaymentSettings ||
  mongoose.model("CourierPaymentSettings", courierPaymentSettingsSchema);

module.exports = {
  CourierPaymentSettings,
  DEFAULT_COURIER_PAYMENT_TIERS: DEFAULT_TIERS,
};
