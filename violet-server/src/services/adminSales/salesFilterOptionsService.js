const { Order } = require("../../models/order");
const { SellerSale } = require("../../models/sellerSale");
const { PAID_STATUSES } = require("./salesStatisticsHelpers");
const {
  getStatisticsDateKey,
  getTashkentYmd,
  getIsoWeekFromYmd,
  getIsoWeekStart,
  toDateKeyFromYmd,
  parseMonthKey,
  getPreviousMonth,
  addDaysToDateKey,
  getRangeKeys,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey } = require("./salesStatisticsHelpers");

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

function getDefaultFilterValues() {
  const today = getTashkentYmd();
  const dayKey = getStatisticsDateKey();
  const { week } = getIsoWeekFromYmd(today.year, today.month, today.day);
  const monthKey = `${today.year}-${String(today.month).padStart(2, "0")}`;
  return {
    day: dayKey,
    week: formatWeekKey(today.year, week),
    month: monthKey,
  };
}

function buildFallbackOptions(defaults) {
  return {
    days: [{ value: defaults.day, label: formatDayLabel(defaults.day) }],
    weeks: [{ value: defaults.week, label: formatWeekLabel(defaults.week) }],
    months: [{ value: defaults.month, label: formatMonthLabel(defaults.month) }],
  };
}

async function loadEarliestPaidDateKey() {
  const [orderRow, sellerRow] = await Promise.all([
    Order.findOne({
      status: { $in: PAID_STATUSES },
      paidAt: { $ne: null },
    })
      .sort({ paidAt: 1 })
      .select({ paidAt: 1 })
      .lean(),
    SellerSale.findOne({ paidAt: { $ne: null } })
      .sort({ paidAt: 1 })
      .select({ paidAt: 1, dateKey: 1 })
      .lean(),
  ]);

  const keys = [];
  if (orderRow?.paidAt) {
    keys.push(getStatisticsDateKey(orderRow.paidAt));
  }
  if (sellerRow?.dateKey) {
    keys.push(String(sellerRow.dateKey));
  }

  if (keys.length === 0) return null;
  return keys.sort()[0];
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

async function buildSalesFilterOptions() {
  const defaults = getDefaultFilterValues();
  const todayKey = defaults.day;
  const earliestKey = await loadEarliestPaidDateKey();

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

function resolveSelectedFilters(query = {}, options = {}) {
  const defaults = getDefaultFilterValues();
  const dayValues = new Set((options.days || []).map((row) => row.value));
  const weekValues = new Set((options.weeks || []).map((row) => row.value));
  const monthValues = new Set((options.months || []).map((row) => row.value));

  let day = String(query.day || defaults.day).trim();
  let week = String(query.week || defaults.week).trim();
  let month = String(query.month || defaults.month).trim();

  if (dayValues.size > 0 && !dayValues.has(day)) {
    day = options.days?.[0]?.value || defaults.day;
  }
  if (weekValues.size > 0 && !weekValues.has(week)) {
    week = options.weeks?.[0]?.value || defaults.week;
  }
  if (monthValues.size > 0 && !monthValues.has(month)) {
    month = options.months?.[0]?.value || defaults.month;
  }

  return { day, week, month };
}

module.exports = {
  MONTH_LABELS_UZ,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getDefaultFilterValues,
  buildSalesFilterOptions,
  resolveSelectedFilters,
};
