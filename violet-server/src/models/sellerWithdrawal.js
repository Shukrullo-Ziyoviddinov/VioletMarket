const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const sellerWithdrawalSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    paymentRequestId: { type: Number, required: true, index: true },
    requestCode: { type: String, required: true, trim: true, index: true },
    sellerId: { type: String, required: true, trim: true, index: true },
    soldItemId: { type: Number, required: true, index: true },
    productId: { type: Number, required: true, index: true },
    amount: { type: Number, default: 0 },
    withdrawnAt: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
  },
  {
    collection: "seller_withdrawals",
    timestamps: true,
    versionKey: false,
  },
);

sellerWithdrawalSchema.index({ sellerId: 1, withdrawnAt: -1 });
sellerWithdrawalSchema.index({ paymentRequestId: 1, soldItemId: 1 }, { unique: true });

sellerWithdrawalSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "seller_withdrawal_id");
});

const SellerWithdrawal =
  mongoose.models.SellerWithdrawal || mongoose.model("SellerWithdrawal", sellerWithdrawalSchema);

module.exports = {
  SellerWithdrawal,
};
