const sellerSubscriptionService = require("../../services/sellerSubscription/sellerSubscriptionService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getMySubscriptions = asyncHandler(async (req, res) => {
  const data = await sellerSubscriptionService.getMySubscriptions(req.userId);
  res.json({ ok: true, ...data });
});

const getSellerStatus = asyncHandler(async (req, res) => {
  const data = await sellerSubscriptionService.getSellerStatus(
    req.params.sellerId,
    req.userId || null,
  );
  res.json({ ok: true, ...data });
});

const toggle = asyncHandler(async (req, res) => {
  const { sellerId } = req.body || {};
  const data = await sellerSubscriptionService.toggleSubscription(req.userId, sellerId);
  res.json({ ok: true, ...data });
});

module.exports = {
  getMySubscriptions,
  getSellerStatus,
  toggle,
};
