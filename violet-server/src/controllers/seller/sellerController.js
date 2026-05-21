const sellerService = require("../../services/seller/sellerService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  const data = await sellerService.getSellerProfile(req.params.sellerId, req.userId || null);
  res.json({ ok: true, ...data });
});

const getProducts = asyncHandler(async (req, res) => {
  const data = await sellerService.getSellerProducts(req.params.sellerId, req.query);
  res.json({ ok: true, ...data });
});

const getRatingSummary = asyncHandler(async (req, res) => {
  const data = await sellerService.getSellerRatingSummary(req.params.sellerId);
  res.json({ ok: true, ...data });
});

module.exports = {
  getProfile,
  getProducts,
  getRatingSummary,
};
