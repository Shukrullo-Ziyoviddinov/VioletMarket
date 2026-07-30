import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function normalizeNotification(row) {
  return {
    id: Number(row?.id) || 0,
    type: String(row?.type || ''),
    paymentRequestId: Number(row?.paymentRequestId) || 0,
    requestCode: String(row?.requestCode || ''),
    sellerId: String(row?.sellerId || ''),
    sellerName: String(row?.sellerName || ''),
    sellerLogoUrl: String(row?.sellerLogoUrl || ''),
    logisticaId: String(row?.logisticaId || ''),
    logisticaName: String(row?.logisticaName || ''),
    courierId: String(row?.courierId || ''),
    courierName: String(row?.courierName || ''),
    itemCount: Number(row?.itemCount) || 0,
    totalAmount: Number(row?.totalAmount) || 0,
    message: String(row?.message || ''),
    readAt: row?.readAt || null,
    createdAt: row?.createdAt || null,
  };
}

export async function fetchAdminNotificationsUnreadCount() {
  const res = await fetch(apiUrl('/api/admin/notifications/unread-count'));
  const payload = await parseJson(res);
  return Number(payload?.data?.unreadCount) || 0;
}

export async function fetchAdminNotifications() {
  const res = await fetch(apiUrl('/api/admin/notifications'));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    unreadCount: Number(data?.unreadCount) || 0,
    notifications: Array.isArray(data?.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
  };
}

export async function markAdminNotificationRead(notificationId) {
  const res = await fetch(apiUrl(`/api/admin/notifications/${notificationId}/read`), {
    method: 'PATCH',
  });
  const payload = await parseJson(res);
  return normalizeNotification(payload?.data?.notification);
}

export async function markAllAdminNotificationsRead() {
  const res = await fetch(apiUrl('/api/admin/notifications/read-all'), {
    method: 'POST',
  });
  const payload = await parseJson(res);
  return {
    updatedCount: Number(payload?.data?.updatedCount) || 0,
    unreadCount: Number(payload?.data?.unreadCount) || 0,
  };
}
