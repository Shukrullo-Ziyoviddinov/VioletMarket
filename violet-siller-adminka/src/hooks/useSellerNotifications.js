import { useCallback, useEffect, useState } from 'react';
import {
  fetchSellerNotifications,
  fetchSellerNotificationsUnreadCount,
  markAllSellerNotificationsRead,
} from '../api/sellerNotificationsApi';
import { useSellerAuth } from '../context/SellerAuthContext';

const POLL_INTERVAL_MS = 30000;

export function useSellerNotifications() {
  const { token, isAuthenticated } = useSellerAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await fetchSellerNotificationsUnreadCount(token);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSellerNotifications(token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAllRead = useCallback(async ({ preserveDisplay = false } = {}) => {
    if (!token) return;

    try {
      const data = await markAllSellerNotificationsRead(token);
      setUnreadCount(data.unreadCount);
      if (!preserveDisplay) {
        setNotifications((rows) =>
          rows.map((row) => ({
            ...row,
            readAt: row.readAt || new Date().toISOString(),
          })),
        );
      }
    } catch {
      await refreshUnreadCount();
    }
  }, [refreshUnreadCount, token]);

  const markDisplayedAsRead = useCallback(() => {
    setNotifications((rows) =>
      rows.map((row) => ({
        ...row,
        readAt: row.readAt || new Date().toISOString(),
      })),
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setNotifications([]);
      return undefined;
    }

    refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refreshUnreadCount, token]);

  return {
    unreadCount,
    notifications,
    loading,
    refreshUnreadCount,
    loadNotifications,
    markAllRead,
    markDisplayedAsRead,
  };
}
