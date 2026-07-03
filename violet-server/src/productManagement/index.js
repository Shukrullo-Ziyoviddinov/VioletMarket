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
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");
const { recordCategoryProductSalesFromOrder } = require("./recordCategoryProductSales");

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
  recordSellerSalesFromOrder,
  recordSellerProductSalesFromOrder,
  recordCategoryProductSalesFromOrder,
};
