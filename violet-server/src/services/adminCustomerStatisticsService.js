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
  getTashkentYmd,
  parseMonthKey,
  toDateKeyFromYmd,
} = require("../utils/customerStatisticsDate");

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

function buildChartKeys(year, month) {
  const lastDay = getDaysInMonth(year, month);
  const today = getTashkentYmd();
  let maxDay = lastDay;

  if (year > today.year || (year === today.year && month > today.month)) {
    return [];
  }

  if (year === today.year && month === today.month) {
    maxDay = Math.min(lastDay, today.day);
  }

  const points = [];
  for (let day = 1; day <= maxDay; day += 1) {
    points.push(day);
  }

  return points.map((day) => toDateKeyFromYmd(year, month, day));
}

function createEmptyBucket() {
  return {
    registered: new Set(),
    unregistered: new Set(),
  };
}

function getWindowKeysInclusive(startKey, endKey) {
  return getRangeKeys(startKey, addDaysToDateKey(endKey, 1));
}

function collectUsersInWindow(buckets, keys, bucketType) {
  const union = new Set();
  for (const key of keys) {
    const set = buckets.get(key)?.[bucketType];
    if (!set) continue;
    for (const visitorKey of set) {
      union.add(visitorKey);
    }
  }
  return union.size;
}

async function buildActivityCharts(year, month) {
  const monthRange = getMonthRange(year, month);
  const chartKeys = buildChartKeys(year, month);
  const minKey = addDaysToDateKey(monthRange.startKey, -6);
  const monthLastKey = addDaysToDateKey(monthRange.endKey, -1);
  const queryKeys = getRangeKeys(minKey, addDaysToDateKey(monthLastKey, 1));

  const rows = await UserActivityDaily.find({
    dateKey: { $in: queryKeys },
  })
    .select({ dateKey: 1, visitorKey: 1, isRegistered: 1 })
    .lean();

  const buckets = new Map();
  for (const key of queryKeys) {
    buckets.set(key, createEmptyBucket());
  }

  for (const row of rows) {
    const key = String(row?.dateKey || "");
    if (!key || !buckets.has(key)) continue;
    const visitorKey = String(row?.visitorKey || "");
    if (!visitorKey) continue;
    const type = row?.isRegistered ? "registered" : "unregistered";
    buckets.get(key)[type].add(visitorKey);
  }

  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))];

  const registered = [];
  const unregistered = [];
  for (const key of chartKeys) {
    const [, , dayRaw] = key.split("-");
    const day = Number(dayRaw);
    const dayStart = addDaysToDateKey(key, -6);
    const wauWindow = getWindowKeysInclusive(dayStart, key);
    const mauWindow = getWindowKeysInclusive(monthRange.startKey, key);

    registered.push({
      label: `${day} ${monthLabel}`,
      dau: collectUsersInWindow(buckets, [key], "registered"),
      wau: collectUsersInWindow(buckets, wauWindow, "registered"),
      mau: collectUsersInWindow(buckets, mauWindow, "registered"),
    });

    unregistered.push({
      label: `${day} ${monthLabel}`,
      dau: collectUsersInWindow(buckets, [key], "unregistered"),
      wau: collectUsersInWindow(buckets, wauWindow, "unregistered"),
      mau: collectUsersInWindow(buckets, mauWindow, "unregistered"),
    });
  }

  return { registered, unregistered };
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
  const charts = await buildActivityCharts(selected.year, selected.month);

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
    charts,
  };
}

module.exports = {
  buildCustomerStatistics,
};
