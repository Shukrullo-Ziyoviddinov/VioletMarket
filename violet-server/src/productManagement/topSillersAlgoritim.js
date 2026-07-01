const { SellerAccount } = require("../models/sellerAccount");
const { SellerRatingSummary } = require("../models/sellerRatingSummary");

const RATING_WEIGHT = 65;
const SALES_WEIGHT = 35;

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function clampRating(value) {
  return Math.max(0, Math.min(5, Number(value) || 0));
}

function calculateTopSellerBall({ averageRating = 0, orderCount = 0, maxOrderCount = 0 } = {}) {
  const rating = clampRating(averageRating);
  const sales = toPositiveNumber(orderCount);
  const maxSales = toPositiveNumber(maxOrderCount);

  const ratingPart = (rating / 5) * RATING_WEIGHT;
  const salesPart =
    maxSales > 0
      ? (Math.log10(sales + 1) / Math.log10(maxSales + 1)) * SALES_WEIGHT
      : 0;

  const topSellerBall = ratingPart + salesPart;
  return Number(topSellerBall.toFixed(4));
}

function buildAverageRatingFromSummary(summaryRow) {
  const totalReviews = toPositiveNumber(summaryRow?.totalReviews);
  const ratingSum = toPositiveNumber(summaryRow?.ratingSum);
  if (!totalReviews) return 0;
  return ratingSum / totalReviews;
}

function rankTopSillers(sellers = []) {
  const normalized = (Array.isArray(sellers) ? sellers : []).map((seller) => ({
    ...seller,
    averageRating: clampRating(seller?.averageRating),
    orderCount: toPositiveNumber(seller?.orderCount),
  }));

  const maxOrderCount = normalized.reduce(
    (max, seller) => Math.max(max, seller.orderCount),
    0,
  );

  return normalized
    .map((seller) => {
      const topSellerBall = calculateTopSellerBall({
        averageRating: seller.averageRating,
        orderCount: seller.orderCount,
        maxOrderCount,
      });

      return {
        ...seller,
        topSellerBall,
      };
    })
    .sort((a, b) => b.topSellerBall - a.topSellerBall);
}

async function buildTopSillersFromDatabase({ limit = 20, onlyActive = true } = {}) {
  const sellerFilter = onlyActive ? { status: "active" } : {};

  const [sellers, ratingRows] = await Promise.all([
    SellerAccount.find(sellerFilter).lean(),
    SellerRatingSummary.find({}).lean(),
  ]);

  const summaryBySellerId = new Map(
    ratingRows.map((row) => [String(row.sellerId || ""), row]),
  );

  const input = sellers.map((seller) => {
    const sellerId = String(seller.id || "");
    const summary = summaryBySellerId.get(sellerId);

    return {
      sellerId,
      name: seller.name,
      logo: seller.logo,
      orderCount: toPositiveNumber(seller.orderCount),
      subscriberCount: toPositiveNumber(seller.subscriberCount),
      averageRating: buildAverageRatingFromSummary(summary),
      totalReviews: toPositiveNumber(summary?.totalReviews),
    };
  });

  return rankTopSillers(input).slice(0, Math.max(1, Number(limit) || 20));
}

module.exports = {
  RATING_WEIGHT,
  SALES_WEIGHT,
  calculateTopSellerBall,
  rankTopSillers,
  buildTopSillersFromDatabase,
};
