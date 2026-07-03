const { asyncHandler } = require("../utils/asyncHandler");
const dashboardService = require("../services/adminSalesStatisticsService");
const pageService = require("../services/adminSales/buildSalesStatisticsPage");
const chartService = require("../services/adminSales/salesRevenueChartService");
const topSellersService = require("../services/adminSales/topSellersStatisticsService");
const topSellingProductsService = require("../services/adminSales/topSellingProductsStatisticsService");
const sellerSoldProductsService = require("../services/adminSales/sellerSoldProductsStatisticsService");
const sellerProductSaleDatesService = require("../services/adminSales/sellerProductSaleDatesService");
const productSellingSellersService = require("../services/adminSales/productSellingSellersStatisticsService");
const categorySalesService = require("../services/adminSales/categorySalesStatisticsService");
const countryCategorySalesService = require("../services/adminSales/countryCategorySalesStatisticsService");
const brandCategorySalesService = require("../services/adminSales/brandCategorySalesStatisticsService");

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

const getSellerSoldProductsStatistics = asyncHandler(async (req, res) => {
  const data = await sellerSoldProductsService.buildSellerSoldProductsStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getSellerProductSaleDates = asyncHandler(async (req, res) => {
  const data = await sellerProductSaleDatesService.buildSellerProductSaleDates(req.query || {});
  res.json({ ok: true, data });
});

const getProductSellingSellersStatistics = asyncHandler(async (req, res) => {
  const data = await productSellingSellersService.buildProductSellingSellersStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getCategorySalesStatistics = asyncHandler(async (req, res) => {
  const data = await categorySalesService.buildCategorySalesStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getCountryCategorySalesStatistics = asyncHandler(async (req, res) => {
  const data = await countryCategorySalesService.buildCountryCategorySalesStatistics(req.query || {});
  res.json({ ok: true, data });
});

const getBrandCategorySalesStatistics = asyncHandler(async (req, res) => {
  const data = await brandCategorySalesService.buildBrandCategorySalesStatistics(req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  getSalesDashboardStats,
  getSalesStatistics,
  getSalesRevenueChart,
  getTopSellersStatistics,
  getTopSellingProductsStatistics,
  getSellerSoldProductsStatistics,
  getSellerProductSaleDates,
  getProductSellingSellersStatistics,
  getCategorySalesStatistics,
  getCountryCategorySalesStatistics,
  getBrandCategorySalesStatistics,
};
