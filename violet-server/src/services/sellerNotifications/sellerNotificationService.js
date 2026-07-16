const { SellerNotification } = require("../../models/sellerNotification");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { nextSequence } = require("../../models/autoIncrement");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  buildProductLabel,
  buildSellerPaymentRequestApprovedMessage,
  buildSellerPaymentRequestRejectedMessage,
} = require("./sellerNotificationMessages");

const DEFAULT_LIMIT = 30;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function resolveProductTitle(product) {
  const title = product?.title;
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim();
  }
  return String(title || "").trim();
}

function mapNotification(row) {
  return {
    id: Number(row.id),
    sellerId: String(row.sellerId || ""),
    type: String(row.type || ""),
    paymentRequestId: Number(row.paymentRequestId) || 0,
    requestCode: String(row.requestCode || ""),
    productLabel: String(row.productLabel || ""),
    itemCount: toNumber(row.itemCount, 0),
    status: String(row.status || ""),
    message: String(row.message || ""),
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
  };
}

async function resolveProductLabelForPaymentRequest(paymentRequestId) {
  const itemRows = await SellerSoldItem.find({ paymentRequestId: Number(paymentRequestId) })
    .select({ id: 1, productId: 1 })
    .lean();
  const productIds = [
    ...new Set(itemRows.map((row) => Number(row.productId)).filter(Number.isFinite)),
  ];
  const products = productIds.length
    ? await Product.find({ id: { $in: productIds } })
        .select({ id: 1, title: 1 })
        .lean()
    : [];
  const productById = new Map(products.map((product) => [Number(product.id), product]));
  const titles = itemRows
    .map((row) => resolveProductTitle(productById.get(Number(row.productId))))
    .filter(Boolean);

  return {
    itemCount: itemRows.length,
    productLabel: buildProductLabel(titles, itemRows.length),
  };
}

async function notifySellerPaymentRequestReviewed(paymentRequest, status) {
  const request = paymentRequest || {};
  const sellerId = cleanSellerId(request.sellerId);
  const normalizedStatus = String(status || "").trim();
  if (!sellerId || !["approved", "rejected"].includes(normalizedStatus)) return null;

  const { itemCount, productLabel } = await resolveProductLabelForPaymentRequest(request.id);
  const message =
    normalizedStatus === "approved"
      ? buildSellerPaymentRequestApprovedMessage(productLabel)
      : buildSellerPaymentRequestRejectedMessage(productLabel);
  const id = await nextSequence("seller_notification_id");

  return SellerNotification.create({
    id,
    sellerId,
    type: `payment_request_${normalizedStatus}`,
    paymentRequestId: Number(request.id),
    requestCode: String(request.requestCode || ""),
    productLabel,
    itemCount,
    status: normalizedStatus,
    message,
    readAt: null,
  });
}

async function getUnreadCountForSeller(sellerId) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) return 0;
  return SellerNotification.countDocuments({ sellerId: normalizedSellerId, readAt: null });
}

async function listNotificationsForSeller(sellerId, query = {}) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const limit = Math.min(50, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_LIMIT))));
  const rows = await SellerNotification.find({ sellerId: normalizedSellerId })
    .sort({ createdAt: -1, id: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await getUnreadCountForSeller(normalizedSellerId);
  return {
    unreadCount,
    notifications: rows.map(mapNotification),
  };
}

async function markNotificationReadForSeller(sellerId, notificationId) {
  const normalizedSellerId = cleanSellerId(sellerId);
  const id = Number(notificationId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(400, "Bildirishnoma ID noto'g'ri", "VALIDATION_ERROR");
  }

  const row = await SellerNotification.findOneAndUpdate(
    { id, sellerId: normalizedSellerId },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();

  if (!row) {
    throw new HttpError(404, "Bildirishnoma topilmadi", "NOT_FOUND");
  }

  return mapNotification(row);
}

async function markAllNotificationsReadForSeller(sellerId) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const reviewedAt = new Date();
  const result = await SellerNotification.updateMany(
    { sellerId: normalizedSellerId, readAt: null },
    { $set: { readAt: reviewedAt } },
  );

  return {
    updatedCount: toNumber(result?.modifiedCount, 0),
    unreadCount: 0,
  };
}

module.exports = {
  notifySellerPaymentRequestReviewed,
  getUnreadCountForSeller,
  listNotificationsForSeller,
  markNotificationReadForSeller,
  markAllNotificationsReadForSeller,
};
