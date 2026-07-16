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

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeNotification(row) {
  return {
    id: Number(row?.id) || 0,
    sellerId: String(row?.sellerId || ''),
    type: String(row?.type || ''),
    paymentRequestId: Number(row?.paymentRequestId) || 0,
    requestCode: String(row?.requestCode || ''),
    productLabel: String(row?.productLabel || ''),
    itemCount: Number(row?.itemCount) || 0,
    status: String(row?.status || ''),
    userId: String(row?.userId || ''),
    userName: String(row?.userName || ''),
    userAvatarUrl: String(row?.userAvatarUrl || ''),
    previewText: String(row?.previewText || ''),
    message: String(row?.message || ''),
    readAt: row?.readAt || null,
    createdAt: row?.createdAt || null,
  };
}

export async function fetchSellerNotificationsUnreadCount(token) {
  const res = await fetch(apiUrl('/api/seller-auth/notifications/unread-count'), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return Number(payload?.data?.unreadCount) || 0;
}

export async function fetchSellerNotifications(token) {
  const res = await fetch(apiUrl('/api/seller-auth/notifications'), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    unreadCount: Number(data?.unreadCount) || 0,
    notifications: Array.isArray(data?.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
  };
}

export async function markAllSellerNotificationsRead(token) {
  const res = await fetch(apiUrl('/api/seller-auth/notifications/read-all'), {
    method: 'POST',
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return {
    updatedCount: Number(payload?.data?.updatedCount) || 0,
    unreadCount: Number(payload?.data?.unreadCount) || 0,
  };
}
