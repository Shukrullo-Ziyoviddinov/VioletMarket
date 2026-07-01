import { useCallback, useEffect, useState } from 'react';
import {
  addChatsPageSearchHistorySeller,
  fetchChatsPageSearchHistory,
  removeChatsPageSearchHistorySeller,
} from '../api/chatsPageSearchApi';

export function useChatsPageSearchHistory(authToken, enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!authToken || !enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchChatsPageSearchHistory(authToken);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSeller = useCallback(
    async (sellerId) => {
      if (!authToken || !sellerId) return items;

      try {
        const data = await addChatsPageSearchHistorySeller(authToken, sellerId);
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setItems(nextItems);
        return nextItems;
      } catch {
        return items;
      }
    },
    [authToken, items],
  );

  const removeSeller = useCallback(
    async (sellerId) => {
      if (!authToken || !sellerId) return items;

      try {
        const data = await removeChatsPageSearchHistorySeller(authToken, sellerId);
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setItems(nextItems);
        return nextItems;
      } catch {
        return items;
      }
    },
    [authToken, items],
  );

  return {
    items,
    loading,
    reload,
    addSeller,
    removeSeller,
  };
}
