const { asyncHandler } = require("../utils/asyncHandler");
const sellerNotificationService = require("../services/sellerNotifications/sellerNotificationService");

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await sellerNotificationService.getUnreadCountForSeller(req.sellerShopId);
  res.json({ ok: true, data: { unreadCount } });
});

const listNotifications = asyncHandler(async (req, res) => {
  const data = await sellerNotificationService.listNotificationsForSeller(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await sellerNotificationService.markNotificationReadForSeller(
    req.sellerShopId,
    req.params.notificationId,
  );
  res.json({ ok: true, data: { notification } });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const data = await sellerNotificationService.markAllNotificationsReadForSeller(req.sellerShopId);
  res.json({ ok: true, data });
});

module.exports = {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
