const { asyncHandler } = require("../utils/asyncHandler");
const userOrderTrackingService = require("../services/userOrderTracking/userOrderTrackingService");
const userCargoFeePaymentService = require("../services/userOrderTracking/userCargoFeePaymentService");

const listMyUzbOrders = asyncHandler(async (req, res) => {
  const data = await userOrderTrackingService.listMyUzbOrderTracking(req.userId);
  res.json({ ok: true, data });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const data = await userOrderTrackingService.listMyOrderTracking(req.userId);
  res.json({ ok: true, data });
});

const getMyCargoFeePayment = asyncHandler(async (req, res) => {
  const data = await userCargoFeePaymentService.getMyCargoFeePaymentDetail(
    req.userId,
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

const payMyCargoFee = asyncHandler(async (req, res) => {
  const data = await userCargoFeePaymentService.payMyCargoFee(
    req.userId,
    req.params.shipmentId,
    req.body?.paymentMethod,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listMyUzbOrders,
  listMyOrders,
  getMyCargoFeePayment,
  payMyCargoFee,
};
