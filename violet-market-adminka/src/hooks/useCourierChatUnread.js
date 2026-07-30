import { useCallback, useEffect, useState } from 'react';
import { fetchCourierChatUnreadCount } from '../api/courierChatAdminApi';
import { ADMIN_NOTIFICATIONS_UPDATED_EVENT } from '../constants/adminEvents';
import {
  connectCourierChatSocket,
  onCourierChatThreadsUpdated,
} from '../socket/courierChatSocketClient';

const POLL_INTERVAL_MS = 30000;

export function useCourierChatUnread() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchCourierChatUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    connectCourierChatSocket();
    const unsubscribe = onCourierChatThreadsUpdated(() => {
      refreshUnread();
      window.dispatchEvent(
        new CustomEvent(ADMIN_NOTIFICATIONS_UPDATED_EVENT),
      );
    });
    const timer = window.setInterval(refreshUnread, POLL_INTERVAL_MS);

    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [refreshUnread]);

  return unreadCount;
}
