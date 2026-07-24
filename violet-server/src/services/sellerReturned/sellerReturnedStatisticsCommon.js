/**
 * Siller qaytarilgan kategoriya statistikasi — umumiy period/filter helperlar.
 * Sotuv (sellerSales) bilan chalkashmaydi.
 */

const {
  buildReturnedProductsFilterOptions,
  resolveSelectedFilters,
} = require("../returnedProducts/returnedProductsFilterService");
const {
  SELLER_RETURNED_LIST_REASON_TYPES,
} = require("../../unitLifecycle/constants");
const {
  addDaysToDateKey,
  getIsoWeekStart,
  parseMonthKey,
} = require("../../utils/customerStatisticsDate");

const PERIOD_LABELS = {
  day: "Kunlik",
  week: "Haftalik",
  month: "Oylik",
};

const MONTH_LABELS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function resolvePeriod(raw) {
  const period = String(raw || "day").trim();
  if (period === "week" || period === "month") return period;
  return "day";
}

function formatDayLabel(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${day} ${monthLabel} ${year}`.trim();
}

function formatMonthLabel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${monthLabel} ${year}`;
}

function formatWeekLabel(weekKey) {
  const raw = String(weekKey || "");
  const match = /^(\d{4})-W(\d{1,2})$/.exec(raw);
  if (!match) return raw;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  const weekStartKey = getIsoWeekStart(isoYear, week);
  const weekEndKey = addDaysToDateKey(weekStartKey, 6);
  const startLabel = formatDayLabel(weekStartKey).replace(/\s\d{4}$/, "");
  const endLabel = formatDayLabel(weekEndKey);
  return `${startLabel} - ${endLabel}`;
}

function buildScopeLabel(period, filters) {
  if (period === "week") return formatWeekLabel(filters.week);
  if (period === "month") return formatMonthLabel(filters.month);
  return formatDayLabel(filters.day);
}

function buildReturnedPeriodMatch(sellerId, period, filters) {
  const match = {
    sellerId: String(sellerId),
    productId: { $gt: 0 },
    reasonType: { $in: [...SELLER_RETURNED_LIST_REASON_TYPES] },
  };

  if (period === "week") {
    match.weekKey = String(filters.week || "");
  } else if (period === "month") {
    match.monthKey = String(filters.month || "");
  } else {
    match.dateKey = String(filters.day || "");
  }

  return match;
}

async function resolveReturnedFilters(sellerId, query = {}) {
  const filterOptions = await buildReturnedProductsFilterOptions({
    sellerId: String(sellerId || "").trim(),
  });
  const filters = resolveSelectedFilters(query, filterOptions);
  const period = resolvePeriod(query.period);
  return { filterOptions, filters, period };
}

module.exports = {
  PERIOD_LABELS,
  resolvePeriod,
  buildScopeLabel,
  buildReturnedPeriodMatch,
  resolveReturnedFilters,
};
