const { AdminNotification } = require("../../models/adminNotification");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { nextSequence } = require("../../models/autoIncrement");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { buildAdminPaymentRequestSubmittedMessage, buildAdminReturnRequestSubmittedMessage } = require("./adminNotificationMessages");

const KEEP_LIMIT = 20;

function resolveSellerDisplayName(account, sellerId) {
  return String(account?.name?.uz || account?.name?.ru || sellerId || "").trim();
}

async function pruneOldAdminNotifications() {
  const keepRows = await AdminNotification.find({})
    .sort({ createdAt: -1, id: -1 })
    .skip(KEEP_LIMIT)
    .select({ id: 1 })
    .lean();

  if (!keepRows.length) return 0;

  const result = await AdminNotification.deleteMany({
    id: { $in: keepRows.map((row) => Number(row.id)).filter(Number.isFinite) },
  });

  return toNumber(result?.deletedCount, 0);
}

function mapNotification(row) {
  return {
    id: Number(row.id),
    type: String(row.type || ""),
    paymentRequestId: Number(row.paymentRequestId) || 0,
    requestCode: String(row.requestCode || ""),
    sellerId: String(row.sellerId || ""),
    sellerName: String(row.sellerName || ""),
    sellerLogoUrl: String(row.sellerLogoUrl || ""),
    itemCount: toNumber(row.itemCount, 0),
    totalAmount: toNumber(row.totalAmount, 0),
    message: String(row.message || ""),
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
  };
}

async function notifyAdminPaymentRequestSubmitted(paymentRequest) {
  const request = paymentRequest || {};
  const sellerId = String(request.sellerId || "").trim();
  if (!sellerId) return null;

  const account = await SellerAccount.findOne({ id: sellerId })
    .select({ id: 1, name: 1, logo: 1 })
    .lean();
  const sellerName = resolveSellerDisplayName(account, sellerId);
  const sellerLogoUrl = resolvePublicAssetUrl(account?.logo || "");
  const id = await nextSequence("admin_notification_id");

  const notification = await AdminNotification.create({
    id,
    type: "payment_request_submitted",
    paymentRequestId: Number(request.id),
    requestCode: String(request.requestCode || ""),
    sellerId,
    sellerName,
    sellerLogoUrl,
    itemCount: toNumber(request.itemCount, 0),
    totalAmount: toNumber(request.totalAmount, 0),
    message: buildAdminPaymentRequestSubmittedMessage(sellerName),
    readAt: null,
  });

  await pruneOldAdminNotifications().catch(() => null);
  return notification;
}

/**
 * Kuryer Ajdaniya so‘rovi — Bildirishnomalar modaliga.
 */
async function notifyAdminReturnRequestSubmitted(returnRequest) {
  const request = returnRequest || {};
  const courierName = [
    request.courier?.firstName,
    request.courier?.lastName,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim() || "Kuryer";

  const productCode = String(request.productCode || "").trim();
  const id = await nextSequence("admin_notification_id");

  const notification = await AdminNotification.create({
    id,
    type: "return_request_submitted",
    paymentRequestId: null,
    requestCode: productCode,
    sellerId: String(request.sellerId || ""),
    sellerName: courierName,
    sellerLogoUrl: resolvePublicAssetUrl(request.imageUrl || ""),
    itemCount: 1,
    totalAmount: toNumber(request.amount, 0),
    message: buildAdminReturnRequestSubmittedMessage({
      courierName,
      productCode,
    }),
    readAt: null,
  });

  await pruneOldAdminNotifications().catch(() => null);
  return notification;
}

async function getUnreadCount() {
  return AdminNotification.countDocuments({ readAt: null });
}

async function listNotifications(query = {}) {
  await pruneOldAdminNotifications().catch(() => null);

  const limit = Math.min(
    KEEP_LIMIT,
    Math.max(1, Math.floor(toNumber(query.limit, KEEP_LIMIT))),
  );
  const rows = await AdminNotification.find({})
    .sort({ createdAt: -1, id: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await getUnreadCount();
  return {
    unreadCount,
    notifications: rows.map(mapNotification),
  };
}

async function markNotificationRead(notificationId) {
  const id = Number(notificationId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(400, "Bildirishnoma ID noto'g'ri", "VALIDATION_ERROR");
  }

  const row = await AdminNotification.findOneAndUpdate(
    { id },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();

  if (!row) {
    throw new HttpError(404, "Bildirishnoma topilmadi", "NOT_FOUND");
  }

  return mapNotification(row);
}

async function markAllNotificationsRead() {
  const reviewedAt = new Date();
  const result = await AdminNotification.updateMany(
    { readAt: null },
    { $set: { readAt: reviewedAt } },
  );

  return {
    updatedCount: toNumber(result?.modifiedCount, 0),
    unreadCount: 0,
  };
}

module.exports = {
  notifyAdminPaymentRequestSubmitted,
  notifyAdminReturnRequestSubmitted,
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
