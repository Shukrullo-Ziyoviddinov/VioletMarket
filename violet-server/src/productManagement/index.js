const { markProductsAsSold } = require("./markProductsAsSold");
const {
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
} = require("./postOrderCommentFlow");

module.exports = {
  markProductsAsSold,
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
};
