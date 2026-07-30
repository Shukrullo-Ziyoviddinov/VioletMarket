const { asyncHandler } = require("../utils/asyncHandler");
const adminLogisticaService = require("../services/adminLogistica/adminLogisticaService");
const adminLogisticaDetailService = require("../services/adminLogistica/adminLogisticaDetailService");

const listLogistica = asyncHandler(async (_req, res) => {
  const data = await adminLogisticaService.listLogistica();
  res.json({ ok: true, data });
});

const approveLogistica = asyncHandler(async (req, res) => {
  const data = await adminLogisticaService.approveLogistica(req.params.id);
  res.json({ ok: true, data });
});

const rejectLogistica = asyncHandler(async (req, res) => {
  const data = await adminLogisticaService.rejectLogistica(req.params.id);
  res.json({ ok: true, data });
});

const deleteLogistica = asyncHandler(async (req, res) => {
  const data = await adminLogisticaService.deleteLogistica(req.params.id);
  res.json({ ok: true, data });
});

const getLogisticaDetail = asyncHandler(async (req, res) => {
  const data = await adminLogisticaDetailService.getLogisticaDetail(req.params.id);
  res.json({ ok: true, data });
});

const listLogisticaDetailHistory = asyncHandler(async (req, res) => {
  const data = await adminLogisticaDetailService.listLogisticaDetailHistory(
    req.params.id,
    req.query || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  listLogistica,
  approveLogistica,
  rejectLogistica,
  deleteLogistica,
  getLogisticaDetail,
  listLogisticaDetailHistory,
};
