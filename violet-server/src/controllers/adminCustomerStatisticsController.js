const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminCustomerStatisticsService");

const getCustomerStatistics = asyncHandler(async (req, res) => {
  const data = await service.buildCustomerStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getCustomerDashboardStats = asyncHandler(async (_req, res) => {
  const data = await service.buildCustomerDashboardStats();
  res.json({ ok: true, data });
});

module.exports = {
  getCustomerStatistics,
  getCustomerDashboardStats,
};
