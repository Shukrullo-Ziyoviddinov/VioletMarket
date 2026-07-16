const { asyncHandler } = require("../utils/asyncHandler");
const userOrderTrackingService = require("../services/userOrderTracking/userOrderTrackingService");

const listMyUzbOrders = asyncHandler(async (req, res) => {
  const data = await userOrderTrackingService.listMyUzbOrderTracking(req.userId);
  res.json({ ok: true, data });
});

module.exports = {
  listMyUzbOrders,
};
