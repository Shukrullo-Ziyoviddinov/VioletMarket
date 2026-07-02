const { Order } = require("../../models/order");
const {
  PAID_STATUSES,
  toNumber,
  dateKeyToRange,
} = require("./salesStatisticsHelpers");
const {
  getMonthRange,
  addDaysToDateKey,
  getIsoWeekStart,
} = require("../../utils/customerStatisticsDate");

async function sumRevenueInRange(start, end) {
  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

async function sumRevenueForDayKey(dayKey) {
  const range = dateKeyToRange(dayKey);
  return sumRevenueInRange(range.start, range.end);
}

async function sumRevenueForWeek(year, week) {
  const weekStartKey = getIsoWeekStart(year, week);
  const weekEndKey = addDaysToDateKey(weekStartKey, 7);
  const start = new Date(`${weekStartKey}T00:00:00+05:00`);
  const end = new Date(`${weekEndKey}T00:00:00+05:00`);
  return sumRevenueInRange(start, end);
}

async function sumRevenueForMonth(year, month) {
  const monthRange = getMonthRange(year, month);
  const start = new Date(`${monthRange.startKey}T00:00:00+05:00`);
  const end = new Date(`${monthRange.endKey}T00:00:00+05:00`);
  return sumRevenueInRange(start, end);
}

async function sumTotalRevenue() {
  const rows = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_STATUSES },
        paidAt: { $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

module.exports = {
  sumRevenueInRange,
  sumRevenueForDayKey,
  sumRevenueForWeek,
  sumRevenueForMonth,
  sumTotalRevenue,
};
