const STATISTICS_TIME_ZONE = "Asia/Tashkent";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTashkentYmd(date = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: STATISTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const [year, month, day] = formatted.split("-").map(Number);
  return { year, month, day };
}

function toDateKeyFromYmd(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getStatisticsDateKey(date = new Date()) {
  const { year, month, day } = getTashkentYmd(date);
  return toDateKeyFromYmd(year, month, day);
}

function parseMonthKey(monthKey) {
  const raw = String(monthKey || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) {
    const now = getTashkentYmd();
    return { year: now.year, month: now.month };
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

function getMonthRange(year, month) {
  const startKey = toDateKeyFromYmd(year, month, 1);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const endKey = toDateKeyFromYmd(nextMonth.year, nextMonth.month, 1);
  return { startKey, endKey };
}

function getPreviousMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getIsoWeekFromYmd(year, month, day) {
  const target = new Date(Date.UTC(year, month - 1, day));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / MS_PER_DAY) + 1) / 7);
  return { isoYear: target.getUTCFullYear(), week };
}

function getIsoWeekStart(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstWeekMonday = new Date(jan4);
  firstWeekMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const result = new Date(firstWeekMonday);
  result.setUTCDate(firstWeekMonday.getUTCDate() + (week - 1) * 7);
  return getStatisticsDateKey(result);
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return toDateKeyFromYmd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

function getRangeKeys(startKey, endKeyExclusive) {
  const keys = [];
  let current = startKey;
  while (current < endKeyExclusive) {
    keys.push(current);
    current = addDaysToDateKey(current, 1);
  }
  return keys;
}

function getDefaultStatisticsFilters(date = new Date()) {
  const { year, month, day } = getTashkentYmd(date);
  const { week } = getIsoWeekFromYmd(year, month, day);
  return {
    day: String(day),
    week: String(week),
    month: `${year}-${String(month).padStart(2, "0")}`,
  };
}

module.exports = {
  STATISTICS_TIME_ZONE,
  getStatisticsDateKey,
  getTashkentYmd,
  parseMonthKey,
  getMonthRange,
  getPreviousMonth,
  getDaysInMonth,
  getIsoWeekFromYmd,
  getIsoWeekStart,
  addDaysToDateKey,
  getRangeKeys,
  getDefaultStatisticsFilters,
  toDateKeyFromYmd,
};
