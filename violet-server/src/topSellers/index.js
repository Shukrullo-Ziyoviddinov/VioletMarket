const {
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
} = require("./topSellersAlgorithm");

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
