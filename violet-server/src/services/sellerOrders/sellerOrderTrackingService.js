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

module.exports = {
  confirmSellerOrderItem,
};
