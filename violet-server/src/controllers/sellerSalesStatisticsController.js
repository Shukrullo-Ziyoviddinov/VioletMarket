const { asyncHandler } = require("../utils/asyncHandler");
const sellerSalesStatisticsService = require("../services/sellerSales/sellerSalesStatisticsService");
const sellerSalesRevenueChartService = require("../services/sellerSales/sellerSalesRevenueChartService");
const sellerTopSellingProductsStatisticsService = require("../services/sellerSales/sellerTopSellingProductsStatisticsService");
const sellerCategorySalesStatisticsService = require("../services/sellerSales/sellerCategorySalesStatisticsService");
const sellerCountryCategorySalesStatisticsService = require("../services/sellerSales/sellerCountryCategorySalesStatisticsService");

const getSellerSalesStatistics = asyncHandler(async (req, res) => {
  const data = await sellerSalesStatisticsService.buildSellerSalesStatisticsPage(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerSalesRevenueChart = asyncHandler(async (req, res) => {
  const data = await sellerSalesRevenueChartService.buildSellerSalesRevenueChart(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerTopSellingProducts = asyncHandler(async (req, res) => {
  const data = await sellerTopSellingProductsStatisticsService.buildSellerTopSellingProductsStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerCategorySalesStatistics = asyncHandler(async (req, res) => {
  const data = await sellerCategorySalesStatisticsService.buildSellerCategorySalesStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerCountryCategorySalesStatistics = asyncHandler(async (req, res) => {
  const data = await sellerCountryCategorySalesStatisticsService.buildSellerCountryCategorySalesStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  getSellerSalesStatistics,
  getSellerSalesRevenueChart,
  getSellerTopSellingProducts,
  getSellerCategorySalesStatistics,
  getSellerCountryCategorySalesStatistics,
};
