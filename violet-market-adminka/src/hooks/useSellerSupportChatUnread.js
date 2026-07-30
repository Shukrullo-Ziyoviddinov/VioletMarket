import { useCallback, useEffect, useState } from 'react';
import { fetchSellerSupportChatUnreadCount } from '../api/sellerSupportChatAdminApi';
import {
  connectSellerSupportChatSocket,
  onSellerSupportChatThreadsUpdated,
} from '../socket/sellerSupportChatSocketClient';

const POLL_INTERVAL_MS = 30000;

export function useSellerSupportChatUnread() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchSellerSupportChatUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    connectSellerSupportChatSocket();
    const unsubscribe = onSellerSupportChatThreadsUpdated(() => {
      refreshUnread();
    });
    const timer = window.setInterval(refreshUnread, POLL_INTERVAL_MS);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [refreshUnread]);

  return unreadCount;
}
