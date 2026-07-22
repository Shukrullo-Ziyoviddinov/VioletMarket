const { asyncHandler } = require("../utils/asyncHandler");
const {
  listAvailableDeliveryOrders,
} = require("../services/deliveryOrders/deliveryAvailableOrdersService");
const {
  acceptOrderUnitByCourier,
  pickUpOrderUnitByCourier,
  advanceAssignmentStepByCourier,
  deliverOrderUnitByCourier,
  getAssignmentForCourier,
} = require("../services/deliveryOrders/courierOrderAssignmentService");
const {
  listAcceptedOrdersForCourier,
} = require("../services/deliveryOrders/courierAcceptedOrdersService");
const {
  listDeliveredHistoryForCourier,
} = require("../services/deliveryOrders/courierDeliveredHistoryService");
const {
  returnOrderUnitByCourier,
} = require("../services/deliveryOrders/courierReturnOrderService");

const listAvailableOrders = asyncHandler(async (req, res) => {
  const data = await listAvailableDeliveryOrders(req.query || {});
  res.json({ ok: true, data });
});

const acceptOrder = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await acceptOrderUnitByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const pickUpOrder = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await pickUpOrderUnitByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const advanceOrderStep = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await advanceAssignmentStepByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const deliverOrder = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await deliverOrderUnitByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const returnOrder = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await returnOrderUnitByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const listAcceptedOrders = asyncHandler(async (req, res) => {
  const data = await listAcceptedOrdersForCourier(req.deliveryId, req.query || {});
  res.json({ ok: true, data });
});

const getAcceptedOrder = asyncHandler(async (req, res) => {
  const data = await getAssignmentForCourier(req.deliveryId, req.params.id);
  res.json({ ok: true, data });
});

const listDeliveredHistory = asyncHandler(async (req, res) => {
  const data = await listDeliveredHistoryForCourier(req.deliveryId);
  res.json({ ok: true, data });
});

module.exports = {
  listAvailableOrders,
  acceptOrder,
  pickUpOrder,
  advanceOrderStep,
  deliverOrder,
  returnOrder,
  listAcceptedOrders,
  getAcceptedOrder,
  listDeliveredHistory,
};
