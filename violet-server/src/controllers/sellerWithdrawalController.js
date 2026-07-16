const { asyncHandler } = require("../utils/asyncHandler");
const sellerWithdrawalService = require("../services/sellerWithdrawals/sellerWithdrawalService");

const listSellerWithdrawals = asyncHandler(async (req, res) => {
  const data = await sellerWithdrawalService.listSellerWithdrawals(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  listSellerWithdrawals,
};
