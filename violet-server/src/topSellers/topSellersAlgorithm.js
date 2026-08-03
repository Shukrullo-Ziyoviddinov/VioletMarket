const { SellerAccount } = require("../models/sellerAccount");
const { SellerRatingSummary } = require("../models/sellerRatingSummary");

const MIN_ORDER_COUNT = 8;
const DEFAULT_TOP_SELLERS_LIMIT = 10;
/** @deprecated Use DEFAULT_TOP_SELLERS_LIMIT */
const DEFAULT_TOP_SILLERS_LIMIT = DEFAULT_TOP_SELLERS_LIMIT;

function toNonNegativeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isEligibleTopSeller(seller) {
  return toNonNegativeNumber(seller?.orderCount) >= MIN_ORDER_COUNT;
}

function clampRating(value) {
  return Math.max(0, Math.min(5, Number(value) || 0));
}

function buildRatingFromSummary(summaryRow) {
  const totalReviews = toNonNegativeNumber(summaryRow?.totalReviews);
  const ratingSum = toNonNegativeNumber(summaryRow?.ratingSum);

  if (!totalReviews) {
    return {
      averageRating: 0,
      averageRatingRaw: 0,
      totalReviews: 0,
      ratingSum: 0,
    };
  }

  const averageRatingRaw = ratingSum / totalReviews;

  return {
    averageRating: Number(averageRatingRaw.toFixed(1)),
    averageRatingRaw,
    totalReviews,
    ratingSum,
  };
}

function buildAverageRatingFromSummary(summaryRow) {
  return buildRatingFromSummary(summaryRow).averageRating;
}

/**
 * Sellerlar orasidan nisbiy tartib:
 * 1) eng yuqori averageRating (seller-rating__average bilan bir xil manba)
 * 2) reyting teng bo'lsa — ko'proq buyurtma
 * 3) yana teng bo'lsa — ko'proq baho soni
 */
function compareTopSellers(a, b) {
  if (b.averageRatingRaw !== a.averageRatingRaw) {
    return b.averageRatingRaw - a.averageRatingRaw;
  }
  if (b.orderCount !== a.orderCount) {
    return b.orderCount - a.orderCount;
  }
  return b.totalReviews - a.totalReviews;
}

/** @deprecated Use compareTopSellers */
const compareTopSillers = compareTopSellers;

function rankTopSellers(sellers = []) {
  return (Array.isArray(sellers) ? sellers : [])
    .filter(isEligibleTopSeller)
    .map((seller) => ({
      ...seller,
      averageRating: clampRating(seller?.averageRating),
      averageRatingRaw: clampRating(seller?.averageRatingRaw),
      orderCount: toNonNegativeNumber(seller?.orderCount),
      totalReviews: toNonNegativeNumber(seller?.totalReviews),
    }))
    .sort(compareTopSellers)
    .map((seller, index) => ({
      ...seller,
      rank: index + 1,
    }));
}

/** @deprecated Use rankTopSellers */
const rankTopSillers = rankTopSellers;

async function buildTopSellersFromDatabase({
  limit = DEFAULT_TOP_SELLERS_LIMIT,
  onlyActive = true,
  minOrderCount = MIN_ORDER_COUNT,
} = {}) {
  const sellerFilter = onlyActive ? { status: "active" } : {};
  const effectiveMinOrders = Math.max(0, Number(minOrderCount) || MIN_ORDER_COUNT);
  const effectiveLimit = Math.max(1, Number(limit) || DEFAULT_TOP_SELLERS_LIMIT);

  const [sellers, ratingRows] = await Promise.all([
    SellerAccount.find(sellerFilter).lean(),
    SellerRatingSummary.find({}).lean(),
  ]);

  const summaryBySellerId = new Map(
    ratingRows.map((row) => [String(row.sellerId || ""), row]),
  );

  const input = sellers
    .map((seller) => {
      const sellerId = String(seller.id || "");
      const summary = summaryBySellerId.get(sellerId);
      const rating = buildRatingFromSummary(summary);
      const orderCount = toNonNegativeNumber(seller.orderCount);

      return {
        sellerId,
        name: seller.name,
        logo: seller.logo,
        orderCount,
        subscriberCount: toNonNegativeNumber(seller.subscriberCount),
        averageRating: rating.averageRating,
        averageRatingRaw: rating.averageRatingRaw,
        totalReviews: rating.totalReviews,
        ratingSum: rating.ratingSum,
      };
    })
    .filter((seller) => seller.orderCount >= effectiveMinOrders);

  return rankTopSellers(input).slice(0, effectiveLimit);
}

/** @deprecated Use buildTopSellersFromDatabase */
const buildTopSillersFromDatabase = buildTopSellersFromDatabase;

function mapTopSellerForClient(row) {
  return {
    id: row.sellerId,
    sellerId: row.sellerId,
    name: row.name,
    logo: row.logo,
    orderCount: row.orderCount,
    subscriberCount: row.subscriberCount,
    averageRating: clampRating(row.averageRating),
    totalReviews: toNonNegativeNumber(row.totalReviews),
    rank: row.rank,
  };
}

module.exports = {
  MIN_ORDER_COUNT,
  DEFAULT_TOP_SELLERS_LIMIT,
  DEFAULT_TOP_SILLERS_LIMIT,
  isEligibleTopSeller,
  rankTopSellers,
  rankTopSillers,
  buildTopSellersFromDatabase,
  buildTopSillersFromDatabase,
  buildAverageRatingFromSummary,
  buildRatingFromSummary,
  mapTopSellerForClient,
};
