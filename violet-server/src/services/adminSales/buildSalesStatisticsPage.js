const {
  buildMetricRow,
  parseWeekKey,
} = require("./salesStatisticsHelpers");
const {
  sumRevenueForDayKey,
  sumRevenueForWeek,
  sumRevenueForMonth,
  sumTotalRevenue,
} = require("./salesRevenueQueryService");
const {
  buildSalesFilterOptions,
  resolveSelectedFilters,
} = require("./salesFilterOptionsService");
const {
  addDaysToDateKey,
  parseMonthKey,
  getPreviousMonth,
} = require("../../utils/customerStatisticsDate");

async function buildSalesStatisticsPage(query = {}) {
  const filterOptions = await buildSalesFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);

  const { day, week, month } = filters;
  const weekParsed = parseWeekKey(week);
  const monthParsed = parseMonthKey(month);
  const prevDayKey = addDaysToDateKey(day, -1);

  const prevWeekParsed = weekParsed
    ? (weekParsed.week === 1
      ? { year: weekParsed.year - 1, week: 52 }
      : { year: weekParsed.year, week: weekParsed.week - 1 })
    : null;

  const prevMonthParsed = getPreviousMonth(monthParsed.year, monthParsed.month);

  const [
    totalRevenue,
    dailyCurrent,
    dailyPrevious,
    weeklyCurrent,
    weeklyPrevious,
    monthlyCurrent,
    monthlyPrevious,
  ] = await Promise.all([
    sumTotalRevenue(),
    sumRevenueForDayKey(day),
    sumRevenueForDayKey(prevDayKey),
    weekParsed ? sumRevenueForWeek(weekParsed.year, weekParsed.week) : 0,
    prevWeekParsed ? sumRevenueForWeek(prevWeekParsed.year, prevWeekParsed.week) : 0,
    sumRevenueForMonth(monthParsed.year, monthParsed.month),
    sumRevenueForMonth(prevMonthParsed.year, prevMonthParsed.month),
  ]);

  return {
    filters,
    filterOptions,
    totalRevenue,
    metrics: {
      daily: {
        title: "Kunlik Savdo",
        ...buildMetricRow(dailyCurrent, dailyPrevious),
      },
      weekly: {
        title: "Haftalik Savdo",
        ...buildMetricRow(weeklyCurrent, weeklyPrevious),
      },
      monthly: {
        title: "Oylik Savdo",
        ...buildMetricRow(monthlyCurrent, monthlyPrevious),
      },
    },
  };
}

module.exports = {
  buildSalesStatisticsPage,
};
