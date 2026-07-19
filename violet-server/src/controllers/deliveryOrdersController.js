const { asyncHandler } = require("../utils/asyncHandler");
const {
  listAvailableDeliveryOrders,
} = require("../services/deliveryOrders/deliveryAvailableOrdersService");
const {
  acceptOrderUnitByCourier,
} = require("../services/deliveryOrders/courierOrderAssignmentService");
const {
  listAcceptedOrdersForCourier,
} = require("../services/deliveryOrders/courierAcceptedOrdersService");

const listAvailableOrders = asyncHandler(async (req, res) => {
  const data = await listAvailableDeliveryOrders(req.query || {});
  res.json({ ok: true, data });
});

const acceptOrder = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await acceptOrderUnitByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const listAcceptedOrders = asyncHandler(async (req, res) => {
  const data = await listAcceptedOrdersForCourier(req.deliveryId, req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  listAvailableOrders,
  acceptOrder,
  listAcceptedOrders,
};
