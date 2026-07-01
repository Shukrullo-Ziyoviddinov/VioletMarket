const { markProductsAsSold } = require("./markProductsAsSold");
const {
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
} = require("./postOrderCommentFlow");
const {
  RATING_WEIGHT,
  SALES_WEIGHT,
  calculateTopSellerBall,
  rankTopSillers,
  buildTopSillersFromDatabase,
} = require("./topSillersAlgoritim");

module.exports = {
  markProductsAsSold,
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
  RATING_WEIGHT,
  SALES_WEIGHT,
  calculateTopSellerBall,
  rankTopSillers,
  buildTopSillersFromDatabase,
};
