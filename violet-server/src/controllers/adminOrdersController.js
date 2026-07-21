const { asyncHandler } = require("../utils/asyncHandler");
const adminOrdersService = require("../services/adminOrders/adminOrdersService");

const listOrders = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.listAdminOrders(req.query || {});
  res.json({ ok: true, data });
});

const getOrderCounts = asyncHandler(async (_req, res) => {
  const data = await adminOrdersService.getAdminOrderCounts();
  res.json({ ok: true, data });
});

const confirmOrderItem = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.confirmAdminOrderItem({
    sellerId: req.body?.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
  });
  res.json({ ok: true, data });
});

const collectOrderItem = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.collectAdminOrderItem({
    sellerId: req.body?.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
  });
  res.json({ ok: true, data });
});

const handoffOrderItem = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.handoffAdminOrderItem({
    sellerId: req.body?.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
  });
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  getOrderCounts,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
};
