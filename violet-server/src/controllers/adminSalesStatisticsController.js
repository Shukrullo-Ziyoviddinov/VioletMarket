const { asyncHandler } = require("../utils/asyncHandler");
const dashboardService = require("../services/adminSalesStatisticsService");
const pageService = require("../services/adminSales/buildSalesStatisticsPage");
const chartService = require("../services/adminSales/salesRevenueChartService");
const topSellersService = require("../services/adminSales/topSellersStatisticsService");
const topSellingProductsService = require("../services/adminSales/topSellingProductsStatisticsService");

const getSalesDashboardStats = asyncHandler(async (_req, res) => {
  const data = await dashboardService.buildSalesDashboardStats();
  res.json({ ok: true, data });
});

const getSalesStatistics = asyncHandler(async (req, res) => {
  const data = await pageService.buildSalesStatisticsPage(req.query || {});
  res.json({ ok: true, data });
});

const getSalesRevenueChart = asyncHandler(async (req, res) => {
  const data = await chartService.buildSalesRevenueChart(req.query || {});
  res.json({ ok: true, data });
});

const getTopSellersStatistics = asyncHandler(async (req, res) => {
  const data = await topSellersService.buildTopSellersStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getTopSellingProductsStatistics = asyncHandler(async (req, res) => {
  const data = await topSellingProductsService.buildTopSellingProductsStatistics(req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  getSalesDashboardStats,
  getSalesStatistics,
  getSalesRevenueChart,
  getTopSellersStatistics,
  getTopSellingProductsStatistics,
};
