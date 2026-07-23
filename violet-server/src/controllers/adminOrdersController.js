const { asyncHandler } = require("../utils/asyncHandler");
const adminOrdersService = require("../services/adminOrders/adminOrdersService");
const noAnswerOrderActionsService = require("../services/noAnswerOrders/noAnswerOrderActionsService");

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

const reHandoffNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.reHandoffNoAnswerOrder(
    req.params.returnedOrderId,
    { resolvedBy: "admin" },
  );
  res.json({ ok: true, data });
});

const reactivateNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.reactivateNoAnswerOrder(
    req.params.returnedOrderId,
    { resolvedBy: "admin" },
  );
  res.json({ ok: true, data });
});

const deliverNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.markDeliveredNoAnswerOrder(
    req.params.returnedOrderId,
    { resolvedBy: "admin" },
  );
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  getOrderCounts,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
  reHandoffNoAnswer,
  reactivateNoAnswer,
  deliverNoAnswer,
};
