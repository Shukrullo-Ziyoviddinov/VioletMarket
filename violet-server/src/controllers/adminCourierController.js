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

module.exports = {
  listCouriers,
  approveCourier,
  rejectCourier,
  deleteCourier,
};
