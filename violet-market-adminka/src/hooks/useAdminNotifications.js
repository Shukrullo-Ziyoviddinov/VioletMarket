import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminNotifications,
  fetchAdminNotificationsUnreadCount,
  markAllAdminNotificationsRead,
} from '../api/adminNotificationsApi';

const POLL_INTERVAL_MS = 30000;

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchAdminNotificationsUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const data = await markAllAdminNotificationsRead();
      setUnreadCount(data.unreadCount);
      setNotifications((rows) => rows.map((row) => ({ ...row, readAt: row.readAt || new Date().toISOString() })));
    } catch {
      await refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    refreshUnreadCount,
    loadNotifications,
    markAllRead,
  };
}
