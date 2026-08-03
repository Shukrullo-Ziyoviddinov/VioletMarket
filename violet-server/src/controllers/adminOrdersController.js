const { asyncHandler } = require("../utils/asyncHandler");
const adminOrdersService = require("../services/adminOrders/adminOrdersService");
const {
  reHandoffNoAnswerOrder,
  reactivateNoAnswerOrder,
  markDeliveredNoAnswerOrder,
} = require("../unitLifecycle");

const listOrders = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.listAdminOrders(req.query || {});
  res.json({ ok: true, data });
});

const getOrderCounts = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.getAdminOrderCounts(req.query || {});
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
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.handoffAdminOrderItem({
    ...body,
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
  });
  res.json({ ok: true, data });
});

const confirmOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.confirmAdminOrderGroup({
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndexes: body.itemIndexes,
  });
  res.json({ ok: true, data });
});

const collectOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.collectAdminOrderGroup({
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndexes: body.itemIndexes,
  });
  res.json({ ok: true, data });
});

const handoffOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.handoffAdminOrderGroup({
    ...body,
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndexes: body.itemIndexes,
  });
  res.json({ ok: true, data });
});

const submitToCargoGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.submitAdminOrderGroupToCargo({
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndexes: body.itemIndexes,
    note: body.note,
    groupId: body.groupId,
  });
  res.json({ ok: true, data });
});

const cancelOrderItem = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.cancelAdminOrderItem({
    sellerId: req.body?.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
  });
  res.json({ ok: true, data });
});

const cancelOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.cancelAdminOrderGroup({
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndexes: body.itemIndexes,
  });
  res.json({ ok: true, data });
});

const markUnavailableOrderItem = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await adminOrdersService.markUnavailableAdminOrderItem({
    sellerId: body.sellerId,
    orderId: req.params.orderId,
    itemIndex: req.params.itemIndex,
    unitIndexes: body.unitIndexes ?? body.unitIndex,
  });
  res.json({ ok: true, data });
});

const reHandoffNoAnswer = asyncHandler(async (req, res) => {
  const data = await reHandoffNoAnswerOrder(req.params.returnedOrderId, {
    resolvedBy: "admin",
  });
  res.json({ ok: true, data });
});

const reactivateNoAnswer = asyncHandler(async (req, res) => {
  const data = await reactivateNoAnswerOrder(req.params.returnedOrderId, {
    resolvedBy: "admin",
  });
  res.json({ ok: true, data });
});

const deliverNoAnswer = asyncHandler(async (req, res) => {
  const data = await markDeliveredNoAnswerOrder(req.params.returnedOrderId, {
    resolvedBy: "admin",
  });
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  getOrderCounts,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
  confirmOrderGroup,
  collectOrderGroup,
  handoffOrderGroup,
  submitToCargoGroup,
  cancelOrderItem,
  cancelOrderGroup,
  markUnavailableOrderItem,
  reHandoffNoAnswer,
  reactivateNoAnswer,
  deliverNoAnswer,
};
