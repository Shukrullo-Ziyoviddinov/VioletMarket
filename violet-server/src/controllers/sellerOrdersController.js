const { asyncHandler } = require("../utils/asyncHandler");
const { listSellerOrders } = require("../productManagement/sellerOrders");
const sellerOrderTrackingService = require("../services/sellerOrders/sellerOrderTrackingService");

const listOrders = asyncHandler(async (req, res) => {
  const data = await listSellerOrders(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

const confirmOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.confirmSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

const collectOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.collectSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  confirmOrderItem,
  collectOrderItem,
};
