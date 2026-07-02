const { SellerSale } = require("../../models/sellerSale");
const { SellerAccount } = require("../../models/sellerAccount");
const { toNumber } = require("./salesStatisticsHelpers");
const { resolveSelectedFilters, buildSalesFilterOptions } = require("./salesFilterOptionsService");
const { backfillSellerSalesFromOrders } = require("../../productManagement/recordSellerSales");
const { backfillSellerProductSalesFromOrders } = require("../../productManagement/recordSellerProductSales");

const PERIOD_LABELS = {
  day: "Kunlik",
  week: "Haftalik",
  month: "Oylik",
};

function resolvePeriod(raw) {
  const period = String(raw || "day").trim();
  if (period === "week" || period === "month") return period;
  return "day";
}

function buildPeriodMatch(period, filters) {
  const match = { sellerId: { $ne: "" } };
  if (period === "week") {
    match.weekKey = String(filters.week || "");
  } else if (period === "month") {
    match.monthKey = String(filters.month || "");
  } else {
    match.dateKey = String(filters.day || "");
  }
  return match;
}

function pickSellerName(seller) {
  if (!seller?.name) return "";
  if (typeof seller.name === "string") return seller.name;
  return seller.name.uz || seller.name.ru || "";
}

async function buildTopSellersStatistics(query = {}) {
  await backfillSellerSalesFromOrders();
  await backfillSellerProductSalesFromOrders();

  const filterOptions = await buildSalesFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const period = resolvePeriod(query.period);
  const match = buildPeriodMatch(period, filters);

  const rows = await SellerSale.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$sellerId",
        totalAmount: { $sum: "$amount" },
        totalQuantity: { $sum: "$quantity" },
        orderIds: { $addToSet: "$orderId" },
      },
    },
    {
      $project: {
        sellerId: "$_id",
        totalAmount: 1,
        totalQuantity: 1,
        orderCount: { $size: "$orderIds" },
      },
    },
    { $sort: { totalAmount: -1, totalQuantity: -1, sellerId: 1 } },
    { $limit: 50 },
  ]);

  const sellerIds = rows.map((row) => String(row.sellerId || "")).filter(Boolean);
  const sellers = sellerIds.length
    ? await SellerAccount.find({ id: { $in: sellerIds } })
      .select("id name logo status")
      .lean()
    : [];
  const sellerMap = new Map(sellers.map((seller) => [String(seller.id), seller]));

  return {
    period,
    periodLabel: PERIOD_LABELS[period] || PERIOD_LABELS.day,
    filters,
    sellers: rows.map((row, index) => {
      const seller = sellerMap.get(String(row.sellerId));
      return {
        rank: index + 1,
        sellerId: String(row.sellerId || ""),
        name: pickSellerName(seller) || String(row.sellerId || ""),
        logo: String(seller?.logo || ""),
        status: String(seller?.status || ""),
        totalAmount: toNumber(row.totalAmount, 0),
        totalQuantity: toNumber(row.totalQuantity, 0),
        orderCount: toNumber(row.orderCount, 0),
      };
    }),
  };
}

module.exports = {
  buildTopSellersStatistics,
};
