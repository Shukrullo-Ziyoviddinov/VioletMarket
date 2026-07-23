const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const {
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getDefaultFilterValues,
  resolveSelectedFilters,
} = require("../adminSales/salesFilterOptionsService");
const {
  addDaysToDateKey,
  getIsoWeekFromYmd,
  getPreviousMonth,
  getStatisticsDateKey,
  parseMonthKey,
  getRangeKeys,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey, toNumber } = require("../adminSales/salesStatisticsHelpers");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const {
  healNoAnswerReturnedReasonTypes,
} = require("../courierReturnRequest/courierReturnRequestService");

function buildFallbackOptions(defaults) {
  return {
    days: [{ value: defaults.day, label: formatDayLabel(defaults.day) }],
    weeks: [{ value: defaults.week, label: formatWeekLabel(defaults.week) }],
    months: [{ value: defaults.month, label: formatMonthLabel(defaults.month) }],
  };
}

function buildDayOptions(startKey, endKey) {
  return getRangeKeys(startKey, addDaysToDateKey(endKey, 1))
    .reverse()
    .map((value) => ({ value, label: formatDayLabel(value) }));
}

function buildWeekOptions(startKey, endKey) {
  const weekSet = new Set();
  let current = startKey;
  while (current <= endKey) {
    const [year, month, day] = current.split("-").map(Number);
    const { isoYear, week } = getIsoWeekFromYmd(year, month, day);
    weekSet.add(formatWeekKey(isoYear, week));
    current = addDaysToDateKey(current, 1);
  }

  return [...weekSet]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatWeekLabel(value) }));
}

function buildMonthOptions(startKey, endKey) {
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const [endYear, endMonth] = endKey.split("-").map(Number);
  const months = [];

  let year = endYear;
  let month = endMonth;

  while (year > startYear || (year === startYear && month >= startMonth)) {
    const value = `${year}-${String(month).padStart(2, "0")}`;
    months.push({ value, label: formatMonthLabel(value) });

    const prev = getPreviousMonth(year, month);
    year = prev.year;
    month = prev.month;
  }

  return months;
}

async function loadEarliestReturnedDateKey(sellerId) {
  const row = await CourierReturnedOrder.findOne({
    sellerId: String(sellerId),
    reasonType: "return",
  })
    .sort({ returnedAt: 1 })
    .select("dateKey returnedAt")
    .lean();

  if (row?.dateKey) return String(row.dateKey);
  if (row?.returnedAt) return getStatisticsDateKey(row.returnedAt);
  return null;
}

async function buildSellerReturnedFilterOptions(sellerId) {
  const defaults = getDefaultFilterValues();
  const todayKey = defaults.day;
  const earliestKey = await loadEarliestReturnedDateKey(sellerId);

  if (!earliestKey) {
    return buildFallbackOptions(defaults);
  }

  const startKey = earliestKey <= todayKey ? earliestKey : todayKey;
  const endKey = todayKey;

  const days = buildDayOptions(startKey, endKey);
  const weeks = buildWeekOptions(startKey, endKey);
  const months = buildMonthOptions(startKey, endKey);

  const ensureSelected = (list, value, labelFn) => {
    if (list.some((row) => row.value === value)) return list;
    return [{ value, label: labelFn(value) }, ...list];
  };

  return {
    days: ensureSelected(days, defaults.day, formatDayLabel),
    weeks: ensureSelected(weeks, defaults.week, formatWeekLabel),
    months: ensureSelected(months, defaults.month, formatMonthLabel),
  };
}

function resolveListPeriod(query = {}, filters) {
  const period = String(query.period || query.activePeriod || "day")
    .trim()
    .toLowerCase();

  if (period === "week") {
    return { field: "weekKey", value: filters.week, period: "week" };
  }
  if (period === "month") {
    return { field: "monthKey", value: filters.month, period: "month" };
  }
  return { field: "dateKey", value: filters.day, period: "day" };
}

async function aggregateReturnedStats(sellerId, match = {}) {
  const rows = await CourierReturnedOrder.aggregate([
    {
      $match: {
        sellerId: String(sellerId),
        ...match,
      },
    },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalQuantity: { $sum: "$quantity" },
        noAnswerCount: {
          $sum: {
            $cond: [{ $eq: ["$reasonType", "no_answer"] }, 1, 0],
          },
        },
        returnCount: {
          $sum: {
            $cond: [{ $eq: ["$reasonType", "return"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const row = rows[0] || {};
  return {
    totalCount: toNumber(row.totalCount, 0),
    totalAmount: toNumber(row.totalAmount, 0),
    totalQuantity: toNumber(row.totalQuantity, 0),
    noAnswerCount: toNumber(row.noAnswerCount, 0),
    returnCount: toNumber(row.returnCount, 0),
  };
}

async function listSellerReturnedOrders(sellerId, query = {}) {
  const shopId = String(sellerId || "").trim();
  const filterOptions = await buildSellerReturnedFilterOptions(shopId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const listPeriod = resolveListPeriod(query, filters);

  const periodMatch = { [listPeriod.field]: listPeriod.value };
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const findFilter = {
    sellerId: shopId,
    reasonType: "return",
    ...periodMatch,
  };

  const returnOnlyMatch = { reasonType: "return" };

  const [rows, total, periodStats, allTimeStats, dayStats, weekStats, monthStats] =
    await Promise.all([
      CourierReturnedOrder.find(findFilter)
        .sort({ returnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourierReturnedOrder.countDocuments(findFilter),
      aggregateReturnedStats(shopId, { ...periodMatch, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, returnOnlyMatch),
      aggregateReturnedStats(shopId, { dateKey: filters.day, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, { weekKey: filters.week, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, { monthKey: filters.month, ...returnOnlyMatch }),
    ]);

  return {
    filters,
    filterOptions,
    activePeriod: listPeriod.period,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      allTime: allTimeStats,
      period: periodStats,
      day: dayStats,
      week: weekStats,
      month: monthStats,
    },
    orders: rows.map(toPublicReturnedOrder),
  };
}

/**
 * Siller "Buyurtmalar" → Javob bermadi filteri.
 * reasonType = no_answer bo‘lgan barcha yozuvlar (qayta qabul qilingan bo‘lsa ham
 * siller tugmalarni bosmaguncha ro‘yxatda qoladi).
 */
async function listSellerNoAnswerOrders(sellerId, query = {}) {
  await healNoAnswerReturnedReasonTypes();

  const shopId = String(sellerId || "").trim();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const findFilter = {
    reasonType: "no_answer",
    sellerId: shopId,
    $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
  };

  const [rows, total] = await Promise.all([
    CourierReturnedOrder.find(findFilter)
      .sort({ returnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourierReturnedOrder.countDocuments(findFilter),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    orders: rows.map((row) => {
      const publicRow = toPublicReturnedOrder(row);
      return {
        ...publicRow,
        trackingStatus: "no_answer",
        buyer: publicRow.customer,
        orderedAt: publicRow.orderedAt,
        noAnswerAt: publicRow.returnedAt,
        amount: publicRow.amount,
        quantity: publicRow.quantity,
      };
    }),
  };
}

module.exports = {
  listSellerReturnedOrders,
  listSellerNoAnswerOrders,
  buildSellerReturnedFilterOptions,
};
