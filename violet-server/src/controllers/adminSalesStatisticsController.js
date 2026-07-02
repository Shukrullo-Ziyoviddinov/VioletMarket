const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminSalesStatisticsService");

const getSalesDashboardStats = asyncHandler(async (_req, res) => {
  const data = await service.buildSalesDashboardStats();
  res.json({ ok: true, data });
});

module.exports = {
  getSalesDashboardStats,
};
