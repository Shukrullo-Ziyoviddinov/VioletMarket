const { Order } = require("../../models/order");
const { PAID_STATUSES, toNumber, resolveTrendTone } = require("./salesStatisticsHelpers");
const { formatWeekKey } = require("./salesStatisticsHelpers");
const {
  formatChartDayLabel,
  formatChartDayTooltip,
  formatChartMonthLabel,
  formatChartWeekLabel,
} = require("./salesChartDateLabels");
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
const { resolveSelectedFilters, buildSalesFilterOptions } = require("./salesFilterOptionsService");

function dateKeyToRange(dateKey) {
  const start = new Date(`${dateKey}T00:00:00+05:00`);
  const end = new Date(`${addDaysToDateKey(dateKey, 1)}T00:00:00+05:00`);
  return { start, end };
}

function monthKeyToRange(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthRange = getMonthRange(year, month);
  return {
    start: new Date(`${monthRange.startKey}T00:00:00+05:00`),
    end: new Date(`${monthRange.endKey}T00:00:00+05:00`),
  };
}

async function aggregateRevenueByDayKeys(dayKeys) {
  if (!Array.isArray(dayKeys) || dayKeys.length === 0) return new Map();

  const minKey = dayKeys[0];
  const maxKey = dayKeys[dayKeys.length - 1];
  const start = new Date(`${minKey}T00:00:00+05:00`);
  const end = new Date(`${addDaysToDateKey(maxKey, 1)}T00:00:00+05:00`);

  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$paidAt",
            timezone: "Asia/Tashkent",
          },
        },
        revenue: { $sum: "$totalAmount" },
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

async function buildDailyChartPoints(monthKey) {
  const dayKeys = buildDayKeysForMonth(monthKey);
  if (dayKeys.length === 0) return [];

  const revenueMap = await aggregateRevenueByDayKeys(dayKeys);
  const points = dayKeys.map((dateKey) => ({
    key: dateKey,
    label: formatChartDayLabel(dateKey),
    tooltipLabel: formatChartDayTooltip(dateKey),
    revenue: revenueMap.get(dateKey) || 0,
  }));

  return attachPointMeta(points);
}

async function buildWeeklyChartPoints(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthRange = getMonthRange(year, month);
  const dayKeys = getRangeKeys(monthRange.startKey, monthRange.endKey);
  const revenueMap = await aggregateRevenueByDayKeys(dayKeys);

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

async function buildMonthlyChartPoints(monthKey) {
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

  const oldest = points[0]?.key;
  const newest = points[points.length - 1]?.key;
  if (!oldest || !newest) return [];

  const startRange = monthKeyToRange(oldest);
  const endRange = monthKeyToRange(newest);
  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $gte: startRange.start, $lt: endRange.end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$paidAt",
            timezone: "Asia/Tashkent",
          },
        },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const revenueMap = new Map(rows.map((row) => [String(row._id), toNumber(row.revenue, 0)]));
  const filled = points.map((point) => ({
    ...point,
    revenue: revenueMap.get(point.key) || 0,
  }));

  return attachPointMeta(filled);
}

async function buildSalesRevenueChart(query = {}) {
  const filterOptions = await buildSalesFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const granularity = ["day", "week", "month"].includes(String(query.granularity || "").trim())
    ? String(query.granularity).trim()
    : "day";

  let points = [];
  if (granularity === "week") {
    points = await buildWeeklyChartPoints(filters.month);
  } else if (granularity === "month") {
    points = await buildMonthlyChartPoints(filters.month);
  } else {
    points = await buildDailyChartPoints(filters.month);
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
  buildSalesRevenueChart,
};
