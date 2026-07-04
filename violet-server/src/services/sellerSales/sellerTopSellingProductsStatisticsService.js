const { SellerProductSale } = require("../../models/sellerProductSale");
const { Product } = require("../../models/product");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { resolveSelectedFilters } = require("../adminSales/salesFilterOptionsService");
const { buildSellerSalesFilterOptions } = require("./sellerSalesStatisticsService");
const { backfillSellerProductSalesFromOrders } = require("../../productManagement/recordSellerProductSales");
const { ensureSalesStatisticsSynced } = require("../../productManagement/salesOrderSyncService");

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

function buildPeriodMatch(sellerId, period, filters) {
  const match = {
    sellerId: String(sellerId),
    productId: { $gt: 0 },
  };

  if (period === "week") {
    match.weekKey = String(filters.week || "");
  } else if (period === "month") {
    match.monthKey = String(filters.month || "");
  } else {
    match.dateKey = String(filters.day || "");
  }

  return match;
}

function pickProductTitle(title) {
  if (!title) return "";
  if (typeof title === "string") return title;
  return title.uz || title.ru || "";
}

function pickProductImage(product, saleImage) {
  const saleImageValue = String(saleImage || "").trim();
  if (saleImageValue && saleImageValue !== "/img/no-image.png") {
    return saleImageValue;
  }

  const productImage = String(product?.image || product?.images?.[0] || "").trim();
  return productImage || saleImageValue || "/img/no-image.png";
}

async function buildSellerTopSellingProductsStatistics(sellerId, query = {}) {
  await ensureSalesStatisticsSynced();
  await backfillSellerProductSalesFromOrders();

  const filterOptions = await buildSellerSalesFilterOptions(sellerId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const period = resolvePeriod(query.period);
  const match = buildPeriodMatch(sellerId, period, filters);

  const rows = await SellerProductSale.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$productId",
        title: { $first: "$title" },
        image: { $first: "$image" },
        totalAmount: { $sum: "$amount" },
        totalQuantity: { $sum: "$quantity" },
        orderIds: { $addToSet: "$orderId" },
      },
    },
    {
      $project: {
        productId: "$_id",
        title: 1,
        image: 1,
        totalAmount: 1,
        totalQuantity: 1,
        orderCount: { $size: "$orderIds" },
      },
    },
    { $sort: { totalQuantity: -1, totalAmount: -1, productId: 1 } },
    { $limit: 50 },
  ]);

  const productIds = rows.map((row) => Number(row.productId)).filter(Number.isFinite);
  const products = productIds.length
    ? await Product.find({ id: { $in: productIds } })
      .select("id title image images")
      .lean()
    : [];
  const productMap = new Map(products.map((product) => [Number(product.id), product]));

  return {
    period,
    periodLabel: PERIOD_LABELS[period] || PERIOD_LABELS.day,
    filters,
    products: rows.map((row, index) => {
      const productId = Number(row.productId);
      const product = productMap.get(productId);
      const title = pickProductTitle(row.title) || pickProductTitle(product?.title) || `Mahsulot #${productId}`;

      return {
        rank: index + 1,
        productId,
        title,
        image: pickProductImage(product, row.image),
        totalAmount: toNumber(row.totalAmount, 0),
        totalQuantity: toNumber(row.totalQuantity, 0),
        orderCount: toNumber(row.orderCount, 0),
      };
    }),
  };
}

module.exports = {
  buildSellerTopSellingProductsStatistics,
};
