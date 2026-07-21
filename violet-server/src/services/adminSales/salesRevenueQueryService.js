const { SellerSale } = require("../../models/sellerSale");
const {
  toNumber,
  formatWeekKey,
} = require("./salesStatisticsHelpers");

/**
 * Asosiy admin daromad — to‘lov (paidAt) emas, topshirish sanasi bo‘yicha.
 * Manba: seller_sales (kuryer "Topshirdim" da yoziladi).
 */
async function sumSellerSalesAmount(match = {}) {
  const rows = await SellerSale.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return toNumber(rows[0]?.total, 0);
}

async function sumRevenueForDayKey(dayKey) {
  if (!dayKey) return 0;
  return sumSellerSalesAmount({ dateKey: String(dayKey) });
}

async function sumRevenueForWeek(year, week) {
  if (!Number.isFinite(year) || !Number.isFinite(week)) return 0;
  return sumSellerSalesAmount({ weekKey: formatWeekKey(year, week) });
}

async function sumRevenueForMonth(year, month) {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return sumSellerSalesAmount({ monthKey });
}

async function sumTotalRevenue() {
  return sumSellerSalesAmount({});
}

module.exports = {
  sumSellerSalesAmount,
  sumRevenueForDayKey,
  sumRevenueForWeek,
  sumRevenueForMonth,
  sumTotalRevenue,
};
