import { useCallback, useEffect, useState } from 'react';
import { fetchSellerSupportChatUnread } from '../api/sellerSupportChatApi';
import { useSellerAuth } from '../context/SellerAuthContext';
import {
  emitSellerSupportChatUpdated,
  onSellerSupportChatThreadsUpdated,
  SELLER_SUPPORT_CHAT_UPDATED_EVENT,
} from '../socket/sellerSupportChatSocketClient';

const POLL_INTERVAL_MS = 30000;

export function useSellerSupportChatUnread() {
  const { token, isAuthenticated } = useSellerAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await fetchSellerSupportChatUnread(token);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return undefined;
    }

    refreshUnread();
    const unsubscribe = onSellerSupportChatThreadsUpdated(token, () => {
      refreshUnread();
    });
    const onLocalUpdate = () => refreshUnread();
    window.addEventListener(SELLER_SUPPORT_CHAT_UPDATED_EVENT, onLocalUpdate);
    const timer = window.setInterval(refreshUnread, POLL_INTERVAL_MS);

    return () => {
      unsubscribe();
      window.removeEventListener(SELLER_SUPPORT_CHAT_UPDATED_EVENT, onLocalUpdate);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, refreshUnread, token]);

  return {
    unreadCount,
    refreshUnread,
    notifySupportChatUpdated: emitSellerSupportChatUpdated,
  };
}
