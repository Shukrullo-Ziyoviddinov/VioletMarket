const { asyncHandler } = require("../utils/asyncHandler");
const adminWithdrawalService = require("../services/adminWithdrawals/adminWithdrawalService");

const getWithdrawalStats = asyncHandler(async (req, res) => {
  const data = await adminWithdrawalService.buildWithdrawalStats();
  res.json({ ok: true, data });
});

const getWithdrawalSellerOptions = asyncHandler(async (req, res) => {
  const sellers = await adminWithdrawalService.listWithdrawalSellerOptions();
  res.json({ ok: true, data: { sellers } });
});

const listWithdrawals = asyncHandler(async (req, res) => {
  const data = await adminWithdrawalService.listWithdrawals(req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  getWithdrawalStats,
  getWithdrawalSellerOptions,
  listWithdrawals,
};
