const { asyncHandler } = require("../utils/asyncHandler");
const adminNotificationService = require("../services/adminNotifications/adminNotificationService");

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await adminNotificationService.getUnreadCount();
  res.json({ ok: true, data: { unreadCount } });
});

const listNotifications = asyncHandler(async (req, res) => {
  const data = await adminNotificationService.listNotifications(req.query || {});
  res.json({ ok: true, data });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await adminNotificationService.markNotificationRead(req.params.notificationId);
  res.json({ ok: true, data: { notification } });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const data = await adminNotificationService.markAllNotificationsRead();
  res.json({ ok: true, data });
});

module.exports = {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
