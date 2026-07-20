const { asyncHandler } = require("../utils/asyncHandler");
const adminCourierService = require("../services/adminCourier/adminCourierService");

const listCouriers = asyncHandler(async (_req, res) => {
  const data = await adminCourierService.listCouriers();
  res.json({ ok: true, data });
});

const approveCourier = asyncHandler(async (req, res) => {
  const data = await adminCourierService.approveCourier(req.params.id);
  res.json({ ok: true, data });
});

const rejectCourier = asyncHandler(async (req, res) => {
  const data = await adminCourierService.rejectCourier(req.params.id);
  res.json({ ok: true, data });
});

const deleteCourier = asyncHandler(async (req, res) => {
  const data = await adminCourierService.deleteCourier(req.params.id);
  res.json({ ok: true, data });
});

const listCourierAcceptedOrders = asyncHandler(async (req, res) => {
  const data = await adminCourierService.listCourierAcceptedOrders(req.params.id, {
    status: req.query.status,
  });
  res.json({ ok: true, data });
});

const updateCourierAssignmentPayment = asyncHandler(async (req, res) => {
  const data = await adminCourierService.updateCourierAssignmentPayment(
    req.params.assignmentId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

const getCourierPaymentSettings = asyncHandler(async (_req, res) => {
  const courierPaymentService = require("../services/courierPayment/courierPaymentService");
  const data = await courierPaymentService.getCourierPaymentSettings();
  res.json({ ok: true, data });
});

const updateCourierPaymentSettings = asyncHandler(async (req, res) => {
  const courierPaymentService = require("../services/courierPayment/courierPaymentService");
  const data = await courierPaymentService.updateCourierPaymentSettings(req.body || {});
  res.json({ ok: true, data });
});

module.exports = {
  listCouriers,
  approveCourier,
  rejectCourier,
  deleteCourier,
  listCourierAcceptedOrders,
  updateCourierAssignmentPayment,
  getCourierPaymentSettings,
  updateCourierPaymentSettings,
};
