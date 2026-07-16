const { Order } = require("../models/order");
const { recordAllSalesFromOrder } = require("./salesOrderSyncService");
const { normalizePaymentMethod } = require("./paymentMethods");

const PAYMENT_SOURCES = {
  CHECKOUT: "checkout",
  DELIVERY_ADMIN: "delivery-admin",
};

function resolveOptionLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const fromName = value.name ?? value.size ?? value.label ?? "";
    if (typeof fromName === "string" || typeof fromName === "number") {
      return String(fromName).trim();
    }
    if (fromName && typeof fromName === "object") {
      return String(fromName.uz || fromName.ru || "").trim();
    }
    return String(value.uz || value.ru || "").trim();
  }
  return "";
}

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
    color: resolveOptionLabel(row.color),
    size: resolveOptionLabel(row.size),
    storage: resolveOptionLabel(row.storage),
    model: resolveOptionLabel(row.model),
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
  paymentMethod,
  source = PAYMENT_SOURCES.CHECKOUT,
  status = "paid",
}) {
  const items = buildOrderItemsFromCart(cartItems, productMap);
  if (items.length === 0) {
    return null;
  }

  const totalAmount = calcOrderTotalAmount(items);
  const paidAt = status === "paid" ? new Date() : null;
  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod, {
    allowMock: source !== PAYMENT_SOURCES.CHECKOUT,
  });

  const order = await Order.create({
    userId,
    items,
    totalAmount,
    paymentMethod: normalizedPaymentMethod,
    status,
    paidAt,
    source,
  });

  await recordAllSalesFromOrder(order);

  return order;
}

module.exports = {
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
};
