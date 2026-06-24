const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminSellerApplication/adminSellerApplicationService");

const listApplications = asyncHandler(async (req, res) => {
  const data = await service.listSellerApplications();
  res.json({ ok: true, data });
});

const approveApplication = asyncHandler(async (req, res) => {
  const data = await service.approveApplication(req.params.id);
  res.json({ ok: true, data });
});

const rejectApplication = asyncHandler(async (req, res) => {
  const data = await service.rejectApplication(req.params.id, req.body?.reason);
  res.json({ ok: true, data });
});

module.exports = {
  listApplications,
  approveApplication,
  rejectApplication,
};
