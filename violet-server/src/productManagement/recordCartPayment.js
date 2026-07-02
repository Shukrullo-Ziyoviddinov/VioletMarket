const { Order } = require("../models/order");
const { recordSellerSalesFromOrder } = require("./recordSellerSales");
const { recordSellerProductSalesFromOrder } = require("./recordSellerProductSales");

const PAYMENT_SOURCES = {
  CHECKOUT: "checkout",
  DELIVERY_ADMIN: "delivery-admin",
};

function mapCartItemToOrderItem(item, productMap) {
  const row = item?.toObject ? item.toObject() : item;
  if (!row) return null;

  const productId = Number(row.productId);
  const quantity = Math.max(1, Number(row.quantity) || 1);
  const price = Math.max(0, Number(row.price) || 0);
  const product = productMap.get(productId) ?? productMap.get(row.productId);
  const sellerId = String(product?.sellerId ?? "").trim();

  return {
    productId,
    sellerId,
    title: row.title ?? "",
    price,
    originalPrice: Math.max(0, Number(row.originalPrice) || 0),
    quantity,
    lineTotal: price * quantity,
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    image: String(row.image || "/img/no-image.png"),
  };
}

function buildOrderItemsFromCart(cartItems, productMap) {
  return (Array.isArray(cartItems) ? cartItems : [])
    .map((item) => mapCartItemToOrderItem(item, productMap))
    .filter(Boolean);
}

function calcOrderTotalAmount(items) {
  return items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
}

/**
 * Savatdan to'lov yozuvini yaratish.
 * Hozir mock to'lov (darhol paid); keyin Payme/Click callback shu funksiyani chaqiradi.
 */
async function recordCartPayment({
  userId,
  cartItems,
  productMap,
  paymentMethod = "mock",
  source = PAYMENT_SOURCES.CHECKOUT,
  status = "paid",
}) {
  const items = buildOrderItemsFromCart(cartItems, productMap);
  if (items.length === 0) {
    return null;
  }

  const totalAmount = calcOrderTotalAmount(items);
  const paidAt = status === "paid" ? new Date() : null;

  const order = await Order.create({
    userId,
    items,
    totalAmount,
    paymentMethod: String(paymentMethod || "mock").trim() || "mock",
    status,
    paidAt,
    source,
  });

  await recordSellerSalesFromOrder(order);
  await recordSellerProductSalesFromOrder(order);

  return order;
}

module.exports = {
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
};
