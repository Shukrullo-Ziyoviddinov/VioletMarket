const { Order } = require("../../models/order");
const { PAID_STATUSES } = require("./salesStatisticsHelpers");
const {
  getStatisticsDateKey,
  getTashkentYmd,
  getIsoWeekFromYmd,
  toDateKeyFromYmd,
  parseMonthKey,
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
  return `${day} ${monthLabel}${year ? ` ${year}` : ""}`.trim();
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
  return `${match[2]}-hafta, ${match[1]}`;
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

async function loadDistinctPaidDateKeys() {
  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $ne: null },
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
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return rows.map((row) => String(row._id)).filter(Boolean);
}

async function buildSalesFilterOptions() {
  const defaults = getDefaultFilterValues();
  const dateKeys = await loadDistinctPaidDateKeys();

  if (dateKeys.length === 0) {
    return buildFallbackOptions(defaults);
  }

  const daySet = new Set(dateKeys);
  daySet.add(defaults.day);

  const weekSet = new Set();
  const monthSet = new Set();

  for (const dateKey of daySet) {
    const [year, month, day] = dateKey.split("-").map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) continue;
    const { isoYear, week } = getIsoWeekFromYmd(year, month, day);
    weekSet.add(formatWeekKey(isoYear, week));
    monthSet.add(`${year}-${String(month).padStart(2, "0")}`);
  }

  monthSet.add(defaults.month);
  weekSet.add(defaults.week);

  const days = [...daySet]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatDayLabel(value) }));

  const weeks = [...weekSet]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatWeekLabel(value) }));

  const months = [...monthSet]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatMonthLabel(value) }));

  return { days, weeks, months };
}

function resolveSelectedFilters(query = {}, options = {}) {
  const defaults = getDefaultFilterValues();
  const dayValues = new Set((options.days || []).map((row) => row.value));
  const weekValues = new Set((options.weeks || []).map((row) => row.value));
  const monthValues = new Set((options.months || []).map((row) => row.value));

  let day = String(query.day || defaults.day).trim();
  let week = String(query.week || defaults.week).trim();
  let month = String(query.month || defaults.month).trim();

  if (!dayValues.has(day)) {
    day = options.days?.[0]?.value || defaults.day;
  }
  if (!weekValues.has(week)) {
    week = options.weeks?.[0]?.value || defaults.week;
  }
  if (!monthValues.has(month)) {
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
