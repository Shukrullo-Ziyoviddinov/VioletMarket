const {
  markProductsAsSold,
  reserveProductsOnCheckout,
  recordProductSoldDisplayMetrics,
  releaseReservedStockOnReturn,
  reserveStockUnitOnRehandoff,
} = require("./markProductsAsSold");
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
const { recordCountryCategoryProductSalesFromOrder } = require("./recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./recordBrandCategoryProductSales");
const {
  formatOrderCode,
  formatProductCode,
  buildSellerOrderCard,
  listSellerOrders,
} = require("./sellerOrders");
const {
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
} = require("./paymentMethods");

module.exports = {
  markProductsAsSold,
  reserveProductsOnCheckout,
  recordProductSoldDisplayMetrics,
  releaseReservedStockOnReturn,
  reserveStockUnitOnRehandoff,
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
  recordCountryCategoryProductSalesFromOrder,
  recordBrandCategoryProductSalesFromOrder,
  recordSalesOnDelivery: require("./recordSalesOnDelivery").recordSalesOnDelivery,
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
  formatOrderCode,
  formatProductCode,
  buildSellerOrderCard,
  listSellerOrders,
};
