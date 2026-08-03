/**
 * productManagement — public shim yo‘llar + ichki domenlar:
 *   checkout/       payment + cart order
 *   sales/          sotildi / statistika (live: recordSalesOnDelivery)
 *   unitTracking/   dona + tracking
 *   seller/         seller order cards
 *   foreign/        xorijiy cargo oqimi
 *   shared/         variant stock
 * Eski require("../productManagement/orderItemUnitTracking") ishlaydi (shim).
 */
const {
  recordProductSoldDisplayMetrics,
} = require("./sales/recordProductSoldDisplayMetrics");
const {
  reserveOnCheckout,
  releaseToWarehouse,
  reReserveForCourier,
  keepReserved,
  discardReserved,
} = require("../inventory");
const {
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
} = require("./checkout/postOrderCommentFlow");
const {
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
} = require("./checkout/recordCartPayment");
const { recordSellerSalesFromOrder } = require("./sales/recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./sales/recordSellerProductSales");
const { recordCategoryProductSalesFromOrder } = require("./sales/recordCategoryProductSales");
const { recordCountryCategoryProductSalesFromOrder } = require("./sales/recordCountryCategoryProductSales");
const { recordBrandCategoryProductSalesFromOrder } = require("./sales/recordBrandCategoryProductSales");
const {
  formatOrderCode,
  formatProductCode,
  buildSellerOrderCard,
  listSellerOrders,
} = require("./seller/sellerOrders");
const {
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
} = require("./checkout/paymentMethods");

module.exports = {
  reserveOnCheckout,
  recordProductSoldDisplayMetrics,
  releaseToWarehouse,
  reReserveForCourier,
  keepReserved,
  discardReserved,
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
  recordSalesOnDelivery: require("./sales/recordSalesOnDelivery").recordSalesOnDelivery,
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
  formatOrderCode,
  formatProductCode,
  buildSellerOrderCard,
  listSellerOrders,
};
