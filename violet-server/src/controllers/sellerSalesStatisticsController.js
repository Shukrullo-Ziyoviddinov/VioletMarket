const { asyncHandler } = require("../utils/asyncHandler");
const sellerSalesStatisticsService = require("../services/sellerSales/sellerSalesStatisticsService");
const sellerSalesRevenueChartService = require("../services/sellerSales/sellerSalesRevenueChartService");

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

module.exports = {
  getSellerSalesStatistics,
  getSellerSalesRevenueChart,
};
