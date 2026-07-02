const { Order } = require("../models/order");
const {
  getPreviousMonth,
  getTashkentYmd,
  toDateKeyFromYmd,
} = require("../utils/customerStatisticsDate");

const PAID_STATUSES = ["paid", "delivered"];

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function calcPercentageChange(current, previous) {
  const curr = toNumber(current, 0);
  const prev = toNumber(previous, 0);
  if (prev <= 0) {
    if (curr <= 0) return 0;
    return 100;
  }
  return ((curr - prev) / prev) * 100;
}

function formatSignedPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function resolveTrendTone(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getTashkentMonthDateRange(year, month) {
  const startKey = toDateKeyFromYmd(year, month, 1);
  const nextMonth = month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
  const endKey = toDateKeyFromYmd(nextMonth.year, nextMonth.month, 1);

  return {
    start: new Date(`${startKey}T00:00:00+05:00`),
    end: new Date(`${endKey}T00:00:00+05:00`),
  };
}

async function sumRevenueInRange(start, end) {
  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

async function buildSalesDashboardStats() {
  const today = getTashkentYmd();
  const currentRange = getTashkentMonthDateRange(today.year, today.month);
  const prevMonth = getPreviousMonth(today.year, today.month);
  const previousRange = getTashkentMonthDateRange(prevMonth.year, prevMonth.month);

  const [monthlyRevenue, previousMonthlyRevenue] = await Promise.all([
    sumRevenueInRange(currentRange.start, currentRange.end),
    sumRevenueInRange(previousRange.start, previousRange.end),
  ]);

  const monthlyGrowthPercent = calcPercentageChange(monthlyRevenue, previousMonthlyRevenue);

  return {
    monthlyRevenue,
    previousMonthlyRevenue,
    monthlyGrowthPercent,
    monthlyGrowthFormatted: formatSignedPercent(monthlyGrowthPercent),
    monthlyGrowthTone: resolveTrendTone(monthlyGrowthPercent),
    month: `${today.year}-${String(today.month).padStart(2, "0")}`,
  };
}

module.exports = {
  buildSalesDashboardStats,
};
