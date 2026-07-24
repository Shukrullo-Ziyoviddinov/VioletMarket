/**
 * Asosiy admin — Qaytarilgan / Yaroqsiz mahsulotlar (read-only).
 * Filter period: returnedProductsFilterService (siller bilan umumiy).
 */

const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { SellerAccount } = require("../../models/sellerAccount");
const {
  formatChartDayLabel,
  formatChartDayTooltip,
  formatChartMonthLabel,
  formatChartWeekLabel,
} = require("../adminSales/salesChartDateLabels");
const {
  toNumber,
  formatWeekKey,
  resolveTrendTone,
} = require("../adminSales/salesStatisticsHelpers");
const {
  getIsoWeekFromYmd,
  getIsoWeekStart,
  getPreviousMonth,
  parseMonthKey,
  getRangeKeys,
  getMonthRange,
  getDaysInMonth,
  getTashkentYmd,
  toDateKeyFromYmd,
} = require("../../utils/customerStatisticsDate");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const {
  SELLER_RETURNED_LIST_REASON_TYPES,
} = require("../../unitLifecycle/constants");
const {
  buildReturnedProductsFilterOptions,
  resolveReturnedListPeriod,
  resolveSelectedFilters,
  getDefaultFilterValues,
} = require("../returnedProducts/returnedProductsFilterService");

const REASON_FILTERS = new Set(["all", "return", "defective"]);

function cleanSellerId(value) {
  return String(value || "").trim();
}

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

function resolveReasonTypes(reasonFilterRaw) {
  const reasonFilter = String(reasonFilterRaw || "all").trim().toLowerCase();
  if (!REASON_FILTERS.has(reasonFilter)) {
    return { reasonFilter: "all", reasonTypes: [...SELLER_RETURNED_LIST_REASON_TYPES] };
  }
  if (reasonFilter === "return") {
    return { reasonFilter, reasonTypes: ["return"] };
  }
  if (reasonFilter === "defective") {
    return { reasonFilter, reasonTypes: ["defective"] };
  }
  return { reasonFilter: "all", reasonTypes: [...SELLER_RETURNED_LIST_REASON_TYPES] };
}

async function loadSellerMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map(cleanSellerId).filter(Boolean))];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name logo sellerCountry status")
    .lean();

  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        logo: String(row.logo || ""),
        sellerCountry: String(row.sellerCountry || ""),
        status: String(row.status || ""),
      },
    ]),
  );
}

async function aggregateReturnedStats(match = {}) {
  const rows = await CourierReturnedOrder.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalQuantity: { $sum: "$quantity" },
        returnCount: {
          $sum: { $cond: [{ $eq: ["$reasonType", "return"] }, 1, 0] },
        },
        defectiveCount: {
          $sum: { $cond: [{ $eq: ["$reasonType", "defective"] }, 1, 0] },
        },
      },
    },
  ]);

  const row = rows[0] || {};
  return {
    totalCount: toNumber(row.totalCount, 0),
    totalAmount: toNumber(row.totalAmount, 0),
    totalQuantity: toNumber(row.totalQuantity, 0),
    returnCount: toNumber(row.returnCount, 0),
    defectiveCount: toNumber(row.defectiveCount, 0),
  };
}

async function aggregateSellerRankings(match = {}, reasonType) {
  const rows = await CourierReturnedOrder.aggregate([
    {
      $match: {
        ...match,
        reasonType,
      },
    },
    {
      $group: {
        _id: "$sellerId",
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
        quantity: { $sum: "$quantity" },
      },
    },
    { $sort: { count: -1, amount: -1 } },
    { $limit: 10 },
  ]);

  const sellerMap = await loadSellerMap(rows.map((row) => row._id));
  return rows.map((row) => {
    const sellerId = cleanSellerId(row._id);
    const seller = sellerMap.get(sellerId) || {
      id: sellerId || "—",
      name: sellerId || "Noma’lum siller",
      logo: "",
    };
    return {
      sellerId: seller.id,
      seller,
      count: toNumber(row.count, 0),
      amount: toNumber(row.amount, 0),
      quantity: toNumber(row.quantity, 0),
    };
  });
}

function attachPointMeta(points) {
  return points.map((point, index) => {
    const previousCount = index > 0 ? toNumber(points[index - 1].count, 0) : null;
    const count = toNumber(point.count, 0);
    let growthPercent = 0;
    if (previousCount != null) {
      if (previousCount <= 0) {
        growthPercent = count > 0 ? 100 : 0;
      } else {
        growthPercent = ((count - previousCount) / previousCount) * 100;
      }
    }
    return {
      ...point,
      count,
      previousCount,
      growthPercent,
      tone: previousCount == null ? "neutral" : resolveTrendTone(growthPercent),
    };
  });
}

async function aggregateCountsByField(field, keys, reasonTypes) {
  if (!Array.isArray(keys) || !keys.length) return new Map();
  const rows = await CourierReturnedOrder.aggregate([
    {
      $match: {
        reasonType: { $in: reasonTypes },
        [field]: { $in: keys.map(String) },
      },
    },
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), {
      count: toNumber(row.count, 0),
      amount: toNumber(row.amount, 0),
    });
  }
  return map;
}

function buildDayKeysForMonth(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const today = getTashkentYmd();
  const lastDay = getDaysInMonth(year, month);
  let maxDay = lastDay;
  if (year > today.year || (year === today.year && month > today.month)) return [];
  if (year === today.year && month === today.month) {
    maxDay = Math.min(lastDay, today.day);
  }
  const keys = [];
  for (let day = 1; day <= maxDay; day += 1) {
    keys.push(toDateKeyFromYmd(year, month, day));
  }
  return keys;
}

async function buildGrowthChart(filters, activePeriod, reasonTypes) {
  const monthKey = String(filters.month || getDefaultFilterValues().month);

  if (activePeriod === "day") {
    const dayKeys = buildDayKeysForMonth(monthKey);
    const map = await aggregateCountsByField("dateKey", dayKeys, reasonTypes);
    return attachPointMeta(
      dayKeys.map((dateKey) => {
        const row = map.get(dateKey) || { count: 0, amount: 0 };
        return {
          key: dateKey,
          label: formatChartDayLabel(dateKey),
          tooltipLabel: formatChartDayTooltip(dateKey),
          count: row.count,
          amount: row.amount,
        };
      }),
    );
  }

  if (activePeriod === "week") {
    const { year, month } = parseMonthKey(monthKey);
    const monthRange = getMonthRange(year, month);
    const dayKeys = getRangeKeys(monthRange.startKey, monthRange.endKey);
    const map = await aggregateCountsByField("dateKey", dayKeys, reasonTypes);
    const weekBuckets = new Map();
    for (const dateKey of dayKeys) {
      const [y, m, d] = dateKey.split("-").map(Number);
      const { isoYear, week } = getIsoWeekFromYmd(y, m, d);
      const bucketKey = formatWeekKey(isoYear, week);
      const weekStartKey = getIsoWeekStart(isoYear, week);
      if (!weekBuckets.has(bucketKey)) {
        weekBuckets.set(bucketKey, {
          key: bucketKey,
          label: formatChartWeekLabel(bucketKey),
          tooltipLabel: formatChartWeekLabel(bucketKey),
          weekStartKey,
          count: 0,
          amount: 0,
        });
      }
      const bucket = weekBuckets.get(bucketKey);
      const dayRow = map.get(dateKey) || { count: 0, amount: 0 };
      bucket.count += dayRow.count;
      bucket.amount += dayRow.amount;
    }
    const points = [...weekBuckets.values()].sort((a, b) =>
      String(a.weekStartKey).localeCompare(String(b.weekStartKey)),
    );
    return attachPointMeta(points);
  }

  const { year, month } = parseMonthKey(monthKey);
  const monthKeys = [];
  let y = year;
  let m = month;
  for (let i = 0; i < 6; i += 1) {
    monthKeys.unshift(`${y}-${String(m).padStart(2, "0")}`);
    const prev = getPreviousMonth(y, m);
    y = prev.year;
    m = prev.month;
  }
  const map = await aggregateCountsByField("monthKey", monthKeys, reasonTypes);
  return attachPointMeta(
    monthKeys.map((key) => {
      const row = map.get(key) || { count: 0, amount: 0 };
      return {
        key,
        label: formatChartMonthLabel(key),
        tooltipLabel: formatChartMonthLabel(key),
        count: row.count,
        amount: row.amount,
      };
    }),
  );
}

async function listAdminReturnedProducts(query = {}) {
  const filterOptions = await buildReturnedProductsFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const listPeriod = resolveReturnedListPeriod(query, filters);
  const { reasonFilter, reasonTypes } = resolveReasonTypes(query.reasonType);

  const periodMatch = { [listPeriod.field]: listPeriod.value };
  const reasonMatch = { reasonType: { $in: reasonTypes } };
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const findFilter = {
    ...reasonMatch,
    ...periodMatch,
  };

  const [
    rows,
    total,
    periodStats,
    allTimeStats,
    dayStats,
    weekStats,
    monthStats,
    topReturnSellers,
    topDefectiveSellers,
    chart,
  ] = await Promise.all([
    CourierReturnedOrder.find(findFilter)
      .sort({ returnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourierReturnedOrder.countDocuments(findFilter),
    aggregateReturnedStats({ ...periodMatch, ...reasonMatch }),
    aggregateReturnedStats(reasonMatch),
    aggregateReturnedStats({ dateKey: filters.day, ...reasonMatch }),
    aggregateReturnedStats({ weekKey: filters.week, ...reasonMatch }),
    aggregateReturnedStats({ monthKey: filters.month, ...reasonMatch }),
    aggregateSellerRankings(periodMatch, "return"),
    aggregateSellerRankings(periodMatch, "defective"),
    buildGrowthChart(filters, listPeriod.period, reasonTypes),
  ]);

  const sellerMap = await loadSellerMap(rows.map((row) => row.sellerId));
  const orders = rows.map((row) => {
    const publicRow = toPublicReturnedOrder(row);
    const sellerId = cleanSellerId(publicRow.sellerId);
    const seller = sellerMap.get(sellerId) || {
      id: sellerId || "—",
      name: sellerId || "Noma’lum siller",
      logo: "",
    };
    return {
      ...publicRow,
      sellerId: seller.id,
      seller,
    };
  });

  return {
    filters,
    filterOptions,
    activePeriod: listPeriod.period,
    reasonFilter,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    stats: {
      allTime: allTimeStats,
      period: periodStats,
      day: dayStats,
      week: weekStats,
      month: monthStats,
    },
    sellerRankings: {
      return: topReturnSellers,
      defective: topDefectiveSellers,
    },
    chart: {
      granularity: listPeriod.period,
      points: chart,
    },
    orders,
  };
}

module.exports = {
  listAdminReturnedProducts,
};
