const { SellerSale } = require("../../models/sellerSale");
const {
  toNumber,
  resolveTrendTone,
  formatWeekKey,
} = require("../adminSales/salesStatisticsHelpers");
const {
  formatChartDayLabel,
  formatChartDayTooltip,
  formatChartMonthLabel,
  formatChartWeekLabel,
} = require("../adminSales/salesChartDateLabels");
const {
  getMonthRange,
  getDaysInMonth,
  getTashkentYmd,
  parseMonthKey,
  addDaysToDateKey,
  getIsoWeekStart,
  getIsoWeekFromYmd,
  getRangeKeys,
  toDateKeyFromYmd,
  getPreviousMonth,
} = require("../../utils/customerStatisticsDate");
const { resolveSelectedFilters } = require("../adminSales/salesFilterOptionsService");
const { buildSellerSalesFilterOptions } = require("./sellerSalesStatisticsService");
const { ensureSalesStatisticsSynced } = require("../../productManagement/salesOrderSyncService");

async function aggregateSellerRevenueByDayKeys(sellerId, dayKeys) {
  if (!Array.isArray(dayKeys) || dayKeys.length === 0) return new Map();

  const rows = await SellerSale.aggregate([
    {
      $match: {
        sellerId: String(sellerId),
        dateKey: { $in: dayKeys },
      },
    },
    {
      $group: {
        _id: "$dateKey",
        revenue: { $sum: "$amount" },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), toNumber(row.revenue, 0));
  }
  return map;
}

async function aggregateSellerRevenueByMonthKeys(sellerId, monthKeys) {
  if (!Array.isArray(monthKeys) || monthKeys.length === 0) return new Map();

  const rows = await SellerSale.aggregate([
    {
      $match: {
        sellerId: String(sellerId),
        monthKey: { $in: monthKeys },
      },
    },
    {
      $group: {
        _id: "$monthKey",
        revenue: { $sum: "$amount" },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), toNumber(row.revenue, 0));
  }
  return map;
}

function buildDayKeysForMonth(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const today = getTashkentYmd();
  const lastDay = getDaysInMonth(year, month);
  let maxDay = lastDay;

  if (year > today.year || (year === today.year && month > today.month)) {
    return [];
  }
  if (year === today.year && month === today.month) {
    maxDay = Math.min(lastDay, today.day);
  }

  const keys = [];
  for (let day = 1; day <= maxDay; day += 1) {
    keys.push(toDateKeyFromYmd(year, month, day));
  }
  return keys;
}

function attachPointMeta(points) {
  return points.map((point, index) => {
    const previousRevenue = index > 0 ? toNumber(points[index - 1].revenue, 0) : null;
    const revenue = toNumber(point.revenue, 0);
    let growthPercent = 0;
    if (previousRevenue != null) {
      if (previousRevenue <= 0) {
        growthPercent = revenue > 0 ? 100 : 0;
      } else {
        growthPercent = ((revenue - previousRevenue) / previousRevenue) * 100;
      }
    }
    return {
      ...point,
      revenue,
      previousRevenue,
      growthPercent,
      tone: previousRevenue == null ? "neutral" : resolveTrendTone(growthPercent),
    };
  });
}

async function buildDailyChartPoints(sellerId, monthKey) {
  const dayKeys = buildDayKeysForMonth(monthKey);
  if (dayKeys.length === 0) return [];

  const revenueMap = await aggregateSellerRevenueByDayKeys(sellerId, dayKeys);
  const points = dayKeys.map((dateKey) => ({
    key: dateKey,
    label: formatChartDayLabel(dateKey),
    tooltipLabel: formatChartDayTooltip(dateKey),
    revenue: revenueMap.get(dateKey) || 0,
  }));

  return attachPointMeta(points);
}

async function buildWeeklyChartPoints(sellerId, monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthRange = getMonthRange(year, month);
  const dayKeys = getRangeKeys(monthRange.startKey, monthRange.endKey);
  const revenueMap = await aggregateSellerRevenueByDayKeys(sellerId, dayKeys);

  const weekBuckets = new Map();
  for (const dateKey of dayKeys) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const { isoYear, week } = getIsoWeekFromYmd(y, m, d);
    const bucketKey = formatWeekKey(isoYear, week);
    const weekStartKey = getIsoWeekStart(isoYear, week);
    const weekEndKey = addDaysToDateKey(weekStartKey, 6);

    if (!weekBuckets.has(bucketKey)) {
      weekBuckets.set(bucketKey, {
        key: bucketKey,
        weekStartKey,
        weekEndKey,
        label: formatChartWeekLabel(weekStartKey, weekEndKey),
        tooltipLabel: formatChartWeekLabel(weekStartKey, weekEndKey),
        revenue: 0,
      });
    }
    weekBuckets.get(bucketKey).revenue += revenueMap.get(dateKey) || 0;
  }

  const points = [...weekBuckets.values()].sort((a, b) => a.weekStartKey.localeCompare(b.weekStartKey));
  return attachPointMeta(points);
}

async function buildMonthlyChartPoints(sellerId, monthKey) {
  const selected = parseMonthKey(monthKey);
  const points = [];

  let year = selected.year;
  let month = selected.month;
  for (let i = 0; i < 12; i += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    points.unshift({
      key,
      label: formatChartMonthLabel(key),
      tooltipLabel: formatChartMonthLabel(key),
      revenue: 0,
    });
    const prev = getPreviousMonth(year, month);
    year = prev.year;
    month = prev.month;
  }

  const monthKeys = points.map((point) => point.key);
  const revenueMap = await aggregateSellerRevenueByMonthKeys(sellerId, monthKeys);
  const filled = points.map((point) => ({
    ...point,
    revenue: revenueMap.get(point.key) || 0,
  }));

  return attachPointMeta(filled);
}

async function buildSellerSalesRevenueChart(sellerId, query = {}) {
  await ensureSalesStatisticsSynced();

  const filterOptions = await buildSellerSalesFilterOptions(sellerId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const granularity = ["day", "week", "month"].includes(String(query.granularity || "").trim())
    ? String(query.granularity).trim()
    : "day";

  let points = [];
  if (granularity === "week") {
    points = await buildWeeklyChartPoints(sellerId, filters.month);
  } else if (granularity === "month") {
    points = await buildMonthlyChartPoints(sellerId, filters.month);
  } else {
    points = await buildDailyChartPoints(sellerId, filters.month);
  }

  const first = points[0]?.revenue ?? 0;
  const last = points[points.length - 1]?.revenue ?? 0;
  const overallTone = points.length > 1 ? resolveTrendTone(last - first) : "neutral";

  return {
    granularity,
    filters,
    points,
    overallTone,
  };
}

module.exports = {
  buildSellerSalesRevenueChart,
};
