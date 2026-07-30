import { useCallback, useEffect, useState } from 'react';
import { fetchLogisticaChatUnreadCount } from '../api/logisticaChatAdminApi';
import { ADMIN_NOTIFICATIONS_UPDATED_EVENT } from '../constants/adminEvents';
import {
  connectLogisticaChatSocket,
  onLogisticaChatThreadsUpdated,
} from '../socket/logisticaChatSocketClient';

const POLL_INTERVAL_MS = 30000;

export function useLogisticaChatUnread() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchLogisticaChatUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    connectLogisticaChatSocket();
    const unsubscribe = onLogisticaChatThreadsUpdated(() => {
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
