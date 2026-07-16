const { asyncHandler } = require("../utils/asyncHandler");
const sellerEarningsService = require("../services/sellerEarnings/sellerEarningsService");

const getSellerEarningsSummary = asyncHandler(async (req, res) => {
  const data = await sellerEarningsService.buildSellerEarningsSummary(req.sellerShopId);
  res.json({ ok: true, data });
});

const getSellerSoldItems = asyncHandler(async (req, res) => {
  const data = await sellerEarningsService.listSellerSoldItems(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

const submitSellerWithdrawalRequest = asyncHandler(async (req, res) => {
  const data = await sellerEarningsService.submitSellerWithdrawalRequest(
    req.sellerShopId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  getSellerEarningsSummary,
  getSellerSoldItems,
  submitSellerWithdrawalRequest,
};
