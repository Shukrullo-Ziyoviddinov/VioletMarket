const { User } = require("../models/user");
const { UserActivityDaily } = require("../models/userActivityDaily");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function parseMonthKey(monthKey) {
  const raw = String(monthKey || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

function getMonthRangeUTC(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

function getPreviousMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function getIsoWeekStartUTC(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstWeekMonday = new Date(jan4);
  firstWeekMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const result = new Date(firstWeekMonday);
  result.setUTCDate(firstWeekMonday.getUTCDate() + (week - 1) * 7);
  return result;
}

function getRangeKeys(start, endExclusive) {
  const keys = [];
  for (let time = start.getTime(); time < endExclusive.getTime(); time += MS_PER_DAY) {
    keys.push(toDateKey(new Date(time)));
  }
  return keys;
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
  const selected = parseMonthKey(filters.month);
  const day = Math.max(1, Math.min(31, toNumber(filters.day, 1)));
  const week = Math.max(1, Math.min(53, toNumber(filters.week, 1)));

  const monthRange = getMonthRangeUTC(selected.year, selected.month);
  const previousMonth = getPreviousMonth(selected.year, selected.month);
  const previousMonthRange = getMonthRangeUTC(previousMonth.year, previousMonth.month);

  const monthDayCount = new Date(Date.UTC(selected.year, selected.month, 0)).getUTCDate();
  const safeDay = Math.min(day, monthDayCount);
  const dayStart = new Date(Date.UTC(selected.year, selected.month - 1, safeDay, 0, 0, 0, 0));
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
  const prevDayStart = new Date(dayStart.getTime() - MS_PER_DAY);
  const prevDayEnd = dayStart;

  const weekStart = getIsoWeekStartUTC(selected.year, week);
  const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * MS_PER_DAY);
  const prevWeekEnd = weekStart;

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
    User.countDocuments({ createdAt: { $gte: monthRange.start, $lt: monthRange.end } }),
    User.countDocuments({ createdAt: { $gte: previousMonthRange.start, $lt: previousMonthRange.end } }),
    countDistinctVisitorsByKeys(getRangeKeys(dayStart, dayEnd)),
    countDistinctVisitorsByKeys(getRangeKeys(prevDayStart, prevDayEnd)),
    countDistinctVisitorsByKeys(getRangeKeys(weekStart, weekEnd)),
    countDistinctVisitorsByKeys(getRangeKeys(prevWeekStart, prevWeekEnd)),
    countDistinctVisitorsByKeys(getRangeKeys(monthRange.start, monthRange.end)),
    countDistinctVisitorsByKeys(getRangeKeys(previousMonthRange.start, previousMonthRange.end)),
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
