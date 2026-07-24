/**
 * Qaytarilgan mahsulotlar — kun/hafta/oy filterlari (siller + asosiy admin).
 * Bitta manba: period logikasi drift qilmasin.
 */

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
  getRangeKeys,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey } = require("../adminSales/salesStatisticsHelpers");
const {
  SELLER_RETURNED_LIST_REASON_TYPES,
} = require("../../unitLifecycle/constants");

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

function ensureSelected(list, value, labelFn) {
  if (list.some((row) => row.value === value)) return list;
  return [{ value, label: labelFn(value) }, ...list];
}

/**
 * @param {{ sellerId?: string }} [scope]
 * sellerId berilsa — faqat shu siller; berilmasa — barcha sillerlar (admin).
 */
async function loadEarliestReturnedDateKey(scope = {}) {
  const match = {
    reasonType: { $in: SELLER_RETURNED_LIST_REASON_TYPES },
  };
  const sellerId = String(scope.sellerId || "").trim();
  if (sellerId) match.sellerId = sellerId;

  const row = await CourierReturnedOrder.findOne(match)
    .sort({ returnedAt: 1 })
    .select("dateKey returnedAt")
    .lean();

  if (row?.dateKey) return String(row.dateKey);
  if (row?.returnedAt) return getStatisticsDateKey(row.returnedAt);
  return null;
}

/**
 * @param {{ sellerId?: string }} [scope]
 */
async function buildReturnedProductsFilterOptions(scope = {}) {
  const defaults = getDefaultFilterValues();
  const todayKey = defaults.day;
  const earliestKey = await loadEarliestReturnedDateKey(scope);

  if (!earliestKey) return buildFallbackOptions(defaults);

  const startKey = earliestKey <= todayKey ? earliestKey : todayKey;
  const endKey = todayKey;

  return {
    days: ensureSelected(buildDayOptions(startKey, endKey), defaults.day, formatDayLabel),
    weeks: ensureSelected(buildWeekOptions(startKey, endKey), defaults.week, formatWeekLabel),
    months: ensureSelected(
      buildMonthOptions(startKey, endKey),
      defaults.month,
      formatMonthLabel,
    ),
  };
}

function resolveReturnedListPeriod(query = {}, filters) {
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

module.exports = {
  buildReturnedProductsFilterOptions,
  resolveReturnedListPeriod,
  resolveSelectedFilters,
  getDefaultFilterValues,
};
