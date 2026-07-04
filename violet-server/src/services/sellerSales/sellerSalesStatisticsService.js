const { SellerSale } = require("../../models/sellerSale");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getDefaultFilterValues,
  resolveSelectedFilters,
} = require("../adminSales/salesFilterOptionsService");
const {
  getStatisticsDateKey,
  getIsoWeekFromYmd,
  addDaysToDateKey,
  getRangeKeys,
  getPreviousMonth,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey } = require("../adminSales/salesStatisticsHelpers");
const { ensureSalesStatisticsSynced } = require("../../productManagement/salesOrderSyncService");

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

async function loadEarliestSellerSaleDateKey(sellerId) {
  const row = await SellerSale.findOne({ sellerId: String(sellerId) })
    .sort({ paidAt: 1 })
    .select("dateKey paidAt")
    .lean();

  if (row?.dateKey) {
    return String(row.dateKey);
  }
  if (row?.paidAt) {
    return getStatisticsDateKey(row.paidAt);
  }
  return null;
}

async function buildSellerSalesFilterOptions(sellerId) {
  const defaults = getDefaultFilterValues();
  const todayKey = defaults.day;
  const earliestKey = await loadEarliestSellerSaleDateKey(sellerId);

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

async function sumSellerTotalRevenue(sellerId) {
  const rows = await SellerSale.aggregate([
    { $match: { sellerId: String(sellerId) } },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

async function buildSellerSalesStatisticsPage(sellerId, query = {}) {
  await ensureSalesStatisticsSynced();

  const filterOptions = await buildSellerSalesFilterOptions(sellerId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const totalRevenue = await sumSellerTotalRevenue(sellerId);

  return {
    filters,
    filterOptions,
    totalRevenue,
  };
}

module.exports = {
  buildSellerSalesStatisticsPage,
};
