const { Order } = require("../../models/order");
const { HttpError } = require("../../utils/httpError");
const { normalizeOrderTrackingStatus } = require("../../productManagement/orderTracking");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new HttpError(400, `${fieldName} noto'g'ri`, "VALIDATION_ERROR");
  }
  return number;
}

async function confirmSellerOrderItem(sellerId, orderIdRaw, itemIndexRaw) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const orderId = parsePositiveInteger(orderIdRaw, "orderId");
  const itemIndex = parsePositiveInteger(itemIndexRaw, "itemIndex");
  const order = await Order.findOne({ id: orderId });

  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = order.items?.[itemIndex];
  if (!item || cleanSellerId(item.sellerId) !== normalizedSellerId) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (currentStatus !== "accepted" && currentStatus !== "seller_confirmed") {
    throw new HttpError(
      409,
      "Buyurtma bu bosqichdan o'tgan",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  if (currentStatus === "accepted") {
    const confirmedAt = new Date();
    item.trackingStatus = "seller_confirmed";
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    item.trackingHistory.push({ status: "seller_confirmed", at: confirmedAt });
    await order.save();
  }

  const confirmedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : [])
    .find((entry) => String(entry?.status || "") === "seller_confirmed");

  return {
    orderId,
    itemIndex,
    trackingStatus: "seller_confirmed",
    confirmedAt: confirmedEntry?.at || null,
  };
}

async function collectSellerOrderItem(sellerId, orderIdRaw, itemIndexRaw) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const orderId = parsePositiveInteger(orderIdRaw, "orderId");
  const itemIndex = parsePositiveInteger(itemIndexRaw, "itemIndex");
  const order = await Order.findOne({ id: orderId });

  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = order.items?.[itemIndex];
  if (!item || cleanSellerId(item.sellerId) !== normalizedSellerId) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (currentStatus !== "seller_confirmed" && currentStatus !== "collected") {
    throw new HttpError(
      409,
      "Avval buyurtmani tasdiqlash kerak",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  if (currentStatus === "seller_confirmed") {
    const collectedAt = new Date();
    item.trackingStatus = "collected";
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    item.trackingHistory.push({ status: "collected", at: collectedAt });
    await order.save();
  }

  const collectedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : [])
    .find((entry) => String(entry?.status || "") === "collected");

  return {
    orderId,
    itemIndex,
    trackingStatus: "collected",
    collectedAt: collectedEntry?.at || null,
  };
}

async function handoffSellerOrderItem(sellerId, orderIdRaw, itemIndexRaw) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const orderId = parsePositiveInteger(orderIdRaw, "orderId");
  const itemIndex = parsePositiveInteger(itemIndexRaw, "itemIndex");
  const order = await Order.findOne({ id: orderId });

  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = order.items?.[itemIndex];
  if (!item || cleanSellerId(item.sellerId) !== normalizedSellerId) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (currentStatus !== "collected" && currentStatus !== "handed_to_courier") {
    throw new HttpError(
      409,
      "Avval buyurtmani yig‘ish kerak",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  if (currentStatus === "collected") {
    const handedAt = new Date();
    item.trackingStatus = "handed_to_courier";
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    item.trackingHistory.push({ status: "handed_to_courier", at: handedAt });
    await order.save();
  }

  const handedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : [])
    .find((entry) => String(entry?.status || "") === "handed_to_courier");

  return {
    orderId,
    itemIndex,
    trackingStatus: "handed_to_courier",
    handedToCourierAt: handedEntry?.at || null,
  };
}

module.exports = {
  confirmSellerOrderItem,
  collectSellerOrderItem,
  handoffSellerOrderItem,
};
