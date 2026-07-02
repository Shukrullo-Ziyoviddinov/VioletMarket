const { buildMetricRow } = require("./adminSales/salesStatisticsHelpers");
const {
  sumRevenueForMonth,
} = require("./adminSales/salesRevenueQueryService");
const {
  getTashkentYmd,
  getPreviousMonth,
} = require("../utils/customerStatisticsDate");

async function buildSalesDashboardStats() {
  const today = getTashkentYmd();
  const prevMonth = getPreviousMonth(today.year, today.month);

  const [monthlyRevenue, previousMonthlyRevenue] = await Promise.all([
    sumRevenueForMonth(today.year, today.month),
    sumRevenueForMonth(prevMonth.year, prevMonth.month),
  ]);

  const metric = buildMetricRow(monthlyRevenue, previousMonthlyRevenue);

  return {
    monthlyRevenue: metric.value,
    previousMonthlyRevenue: metric.previousValue,
    monthlyGrowthPercent: metric.growthPercent,
    monthlyGrowthFormatted: metric.growthFormatted,
    monthlyGrowthTone: metric.tone,
    month: `${today.year}-${String(today.month).padStart(2, "0")}`,
  };
}

module.exports = {
  buildSalesDashboardStats,
};
