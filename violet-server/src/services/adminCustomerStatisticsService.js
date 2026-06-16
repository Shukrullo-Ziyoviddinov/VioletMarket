const { User } = require("../models/user");
const { UserActivityDaily } = require("../models/userActivityDaily");
const {
  addDaysToDateKey,
  getDaysInMonth,
  getDefaultStatisticsFilters,
  getIsoWeekStart,
  getMonthRange,
  getPreviousMonth,
  getRangeKeys,
  getStatisticsDateKey,
  parseMonthKey,
  toDateKeyFromYmd,
} = require("../utils/customerStatisticsDate");

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function countDistinctVisitorsByKeys(dateKeys) {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0;
  const distinct = await UserActivityDaily.distinct("visitorKey", { dateKey: { $in: dateKeys } });
  return distinct.length;
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

async function buildCustomerStatistics(filters = {}) {
  const defaults = getDefaultStatisticsFilters();
  const selected = parseMonthKey(filters.month || defaults.month);
  const day = Math.max(1, Math.min(31, toNumber(filters.day || defaults.day, 1)));
  const week = Math.max(1, Math.min(53, toNumber(filters.week || defaults.week, 1)));

  const monthRange = getMonthRange(selected.year, selected.month);
  const previousMonth = getPreviousMonth(selected.year, selected.month);
  const previousMonthRange = getMonthRange(previousMonth.year, previousMonth.month);

  const monthDayCount = getDaysInMonth(selected.year, selected.month);
  const safeDay = Math.min(day, monthDayCount);
  const dayKey = toDateKeyFromYmd(selected.year, selected.month, safeDay);
  const prevDayKey = addDaysToDateKey(dayKey, -1);

  const weekStartKey = getIsoWeekStart(selected.year, week);
  const weekEndKey = addDaysToDateKey(weekStartKey, 7);
  const prevWeekStartKey = addDaysToDateKey(weekStartKey, -7);

  const [
    totalRegistered,
    registeredInSelectedMonth,
    registeredInPreviousMonth,
    dau,
    prevDau,
    wau,
    prevWau,
    mau,
    prevMau,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({
      createdAt: {
        $gte: new Date(`${monthRange.startKey}T00:00:00+05:00`),
        $lt: new Date(`${monthRange.endKey}T00:00:00+05:00`),
      },
    }),
    User.countDocuments({
      createdAt: {
        $gte: new Date(`${previousMonthRange.startKey}T00:00:00+05:00`),
        $lt: new Date(`${previousMonthRange.endKey}T00:00:00+05:00`),
      },
    }),
    countDistinctVisitorsByKeys([dayKey]),
    countDistinctVisitorsByKeys([prevDayKey]),
    countDistinctVisitorsByKeys(getRangeKeys(weekStartKey, weekEndKey)),
    countDistinctVisitorsByKeys(getRangeKeys(prevWeekStartKey, weekStartKey)),
    countDistinctVisitorsByKeys(getRangeKeys(monthRange.startKey, monthRange.endKey)),
    countDistinctVisitorsByKeys(getRangeKeys(previousMonthRange.startKey, previousMonthRange.endKey)),
  ]);

  const registeredGrowth = calcPercentageChange(registeredInSelectedMonth, registeredInPreviousMonth);
  const dauGrowth = calcPercentageChange(dau, prevDau);
  const wauGrowth = calcPercentageChange(wau, prevWau);
  const mauGrowth = calcPercentageChange(mau, prevMau);

  return {
    filters: {
      day: String(safeDay),
      week: String(week),
      month: `${selected.year}-${String(selected.month).padStart(2, "0")}`,
    },
    meta: {
      todayKey: getStatisticsDateKey(),
      timezone: "Asia/Tashkent",
    },
    metrics: {
      registeredUsers: {
        value: totalRegistered,
        compareLabel: "O'tgan oydan: ",
        compareValue: formatSignedPercent(registeredGrowth),
        compareTone: resolveTrendTone(registeredGrowth),
      },
      dau: {
        value: dau,
        compareLabel: "O'tgan kundan: ",
        compareValue: formatSignedPercent(dauGrowth),
        compareTone: resolveTrendTone(dauGrowth),
      },
      wau: {
        value: wau,
        compareLabel: "O'tgan haftadan: ",
        compareValue: formatSignedPercent(wauGrowth),
        compareTone: resolveTrendTone(wauGrowth),
      },
      mau: {
        value: mau,
        compareLabel: "O'tgan oydan: ",
        compareValue: formatSignedPercent(mauGrowth),
        compareTone: resolveTrendTone(mauGrowth),
      },
    },
  };
}

module.exports = {
  buildCustomerStatistics,
};
