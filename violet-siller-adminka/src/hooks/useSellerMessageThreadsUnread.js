import { useCallback, useEffect, useState } from 'react';
import { fetchSellerMessageThreads } from '../api/messageChatApi';
import { useMessageChatSocketThreadsUpdated } from '../socket/useMessageChatSocket';
import { SELLER_MESSAGE_CHAT_INCOMING_EVENT } from '../socket/useSellerMessageChatSocketHub';

export function useSellerMessageThreadsUnread(authToken, enabled = true) {
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!authToken) {
      setTotalUnread(0);
      return;
    }

    try {
      const data = await fetchSellerMessageThreads(authToken);
      setTotalUnread(Number(data.totalUnread) || 0);
    } catch {
      setTotalUnread(0);
    }
  }, [authToken]);

  useEffect(() => {
    if (!enabled || !authToken) {
      setTotalUnread(0);
      return;
    }
    refreshUnread();
  }, [enabled, authToken, refreshUnread]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onUpdate = () => {
      refreshUnread();
    };

    window.addEventListener('sellerMessageChatUpdated', onUpdate);
    window.addEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, onUpdate);
    return () => {
      window.removeEventListener('sellerMessageChatUpdated', onUpdate);
      window.removeEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, onUpdate);
    };
  }, [enabled, refreshUnread]);

  useMessageChatSocketThreadsUpdated(() => {
    if (enabled && authToken) {
      refreshUnread();
    }
  });

  return totalUnread;
}
