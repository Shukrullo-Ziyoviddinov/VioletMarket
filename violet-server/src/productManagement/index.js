const { markProductsAsSold } = require("./markProductsAsSold");
const {
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
} = require("./postOrderCommentFlow");
const {
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
} = require("./recordCartPayment");

module.exports = {
  markProductsAsSold,
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
};
