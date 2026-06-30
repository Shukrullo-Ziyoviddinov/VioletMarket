import { useCallback, useEffect, useState } from 'react';
import { fetchMessageChatThreads } from '../api/messageChatApi';
import { useMessageChatSocketThreadsUpdated } from '../socket/useMessageChatSocket';

export function useMessageChatThreads(authToken, enabled = true) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const loadThreads = useCallback(async () => {
    if (!authToken) {
      setThreads([]);
      setTotalUnread(0);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMessageChatThreads(authToken);
      setThreads(Array.isArray(data.items) ? data.items : []);
      setTotalUnread(Number(data.totalUnread) || 0);
    } catch {
      setThreads([]);
      setTotalUnread(0);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!enabled || !authToken) {
      setThreads([]);
      setTotalUnread(0);
      setLoading(false);
      return;
    }
    loadThreads();
  }, [enabled, authToken, loadThreads]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onUpdate = () => {
      loadThreads();
    };

    window.addEventListener('messageChatUpdated', onUpdate);
    return () => window.removeEventListener('messageChatUpdated', onUpdate);
  }, [enabled, loadThreads]);

  useMessageChatSocketThreadsUpdated(() => {
    if (enabled && authToken) loadThreads();
  });

  return {
    threads,
    loading,
    totalUnread,
    reload: loadThreads,
  };
}
