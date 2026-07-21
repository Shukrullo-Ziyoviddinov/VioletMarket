const { asyncHandler } = require("../utils/asyncHandler");
const { listSellerOrders } = require("../productManagement/sellerOrders");
const sellerOrderTrackingService = require("../services/sellerOrders/sellerOrderTrackingService");
const {
  listSellerReturnedOrders,
} = require("../services/sellerOrders/sellerReturnedOrdersService");

const listOrders = asyncHandler(async (req, res) => {
  const data = await listSellerOrders(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

const listReturnedOrders = asyncHandler(async (req, res) => {
  const data = await listSellerReturnedOrders(req.sellerShopId, req.query || {});
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

const handoffOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.handoffSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  listReturnedOrders,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
};
