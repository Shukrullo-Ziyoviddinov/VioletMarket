const { SellerSale } = require("../../models/sellerSale");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

async function sumSellerAmount(sellerId, match = {}) {
  const rows = await SellerSale.aggregate([
    {
      $match: {
        sellerId: String(sellerId),
        ...match,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

async function sumSellerRevenueForDayKey(sellerId, dayKey) {
  if (!dayKey) return 0;
  return sumSellerAmount(sellerId, { dateKey: String(dayKey) });
}

async function sumSellerRevenueForWeekKey(sellerId, weekKey) {
  if (!weekKey) return 0;
  return sumSellerAmount(sellerId, { weekKey: String(weekKey) });
}

async function sumSellerRevenueForMonthKey(sellerId, monthKey) {
  if (!monthKey) return 0;
  return sumSellerAmount(sellerId, { monthKey: String(monthKey) });
}

module.exports = {
  sumSellerRevenueForDayKey,
  sumSellerRevenueForWeekKey,
  sumSellerRevenueForMonthKey,
};
