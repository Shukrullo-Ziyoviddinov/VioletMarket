const { asyncHandler } = require("../utils/asyncHandler");
const {
  listAvailableDeliveryOrders,
} = require("../services/deliveryOrders/deliveryAvailableOrdersService");

const listAvailableOrders = asyncHandler(async (req, res) => {
  const data = await listAvailableDeliveryOrders(req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  listAvailableOrders,
};
