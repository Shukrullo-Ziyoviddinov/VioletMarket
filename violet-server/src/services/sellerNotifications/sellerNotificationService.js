const { SellerNotification } = require("../../models/sellerNotification");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { Product } = require("../../models/product");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { nextSequence } = require("../../models/autoIncrement");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  buildProductLabel,
  buildSellerPaymentRequestApprovedMessage,
  buildSellerPaymentRequestRejectedMessage,
  buildChatPreviewText,
  buildSellerChatMessageReceivedMessage,
} = require("./sellerNotificationMessages");

const KEEP_LIMIT = 20;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function resolveUserDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return fullName || "Mijoz";
}

async function pruneOldSellerNotifications(sellerId) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) return 0;

  const keepRows = await SellerNotification.find({ sellerId: normalizedSellerId })
    .sort({ createdAt: -1, id: -1 })
    .skip(KEEP_LIMIT)
    .select({ id: 1 })
    .lean();

  if (!keepRows.length) return 0;

  const result = await SellerNotification.deleteMany({
    sellerId: normalizedSellerId,
    id: { $in: keepRows.map((row) => Number(row.id)).filter(Number.isFinite) },
  });

  return toNumber(result?.deletedCount, 0);
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
    userId: String(row.userId || ""),
    userName: String(row.userName || ""),
    userAvatarUrl: String(row.userAvatarUrl || ""),
    previewText: String(row.previewText || ""),
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

  const notification = await SellerNotification.create({
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

  await pruneOldSellerNotifications(sellerId).catch(() => null);
  return notification;
}

async function notifySellerChatMessageReceived({ sellerId, userId, messageType, content }) {
  const normalizedSellerId = cleanSellerId(sellerId);
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedSellerId || !normalizedUserId) return null;

  const user = await User.findById(normalizedUserId)
    .select({ firstName: 1, lastName: 1, profileImage: 1 })
    .lean();

  const userName = resolveUserDisplayName(user);
  const userAvatarUrl = resolvePublicAssetUrl(user?.profileImage || "");
  const previewText = buildChatPreviewText(messageType, content);
  if (!previewText) return null;

  const id = await nextSequence("seller_notification_id");
  const notification = await SellerNotification.create({
    id,
    sellerId: normalizedSellerId,
    type: "chat_message_received",
    userId: normalizedUserId,
    userName,
    userAvatarUrl,
    previewText,
    message: buildSellerChatMessageReceivedMessage(userName),
    readAt: null,
  });

  await pruneOldSellerNotifications(normalizedSellerId).catch(() => null);
  return notification;
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

  await pruneOldSellerNotifications(normalizedSellerId).catch(() => null);

  const limit = Math.min(
    KEEP_LIMIT,
    Math.max(1, Math.floor(toNumber(query.limit, KEEP_LIMIT))),
  );
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
  notifySellerChatMessageReceived,
  getUnreadCountForSeller,
  listNotificationsForSeller,
  markNotificationReadForSeller,
  markAllNotificationsReadForSeller,
};
