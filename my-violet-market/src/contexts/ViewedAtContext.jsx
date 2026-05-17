import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useUser } from './UserContext';
import { fetchViewedProducts, recordProductView } from '../api/viewedAtApi';

const ViewedAtContext = createContext();

export const useViewedAt = () => {
  const context = useContext(ViewedAtContext);
  if (!context) {
    throw new Error('useViewedAt must be used within ViewedAtProvider');
  }
  return context;
};

export const ViewedAtProvider = ({ children }) => {
  const { authToken, userData } = useUser();
  const [items, setItems] = useState([]);
  const lastRecordedRef = useRef({ productId: null, at: 0 });

  const recentProductIds = useMemo(
    () => items.map((item) => item.productId).filter((id) => id != null),
    [items],
  );

  const syncFromResponse = useCallback((data) => {
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  const loadViewed = useCallback(async () => {
    if (!authToken) {
      setItems([]);
      return;
    }
    try {
      const data = await fetchViewedProducts(authToken);
      syncFromResponse(data);
    } catch (err) {
      console.error('Ko‘rilgan mahsulotlar yuklanmadi:', err);
    }
  }, [authToken, syncFromResponse]);

  useEffect(() => {
    loadViewed();
  }, [loadViewed, userData.id]);

  /** ProductDetail sahifasiga kirganda — fon rejimida */
  const recordView = useCallback(
    async (productId) => {
      if (productId == null || !authToken) return false;

      const idStr = String(productId);
      const now = Date.now();
      if (
        lastRecordedRef.current.productId === idStr &&
        now - lastRecordedRef.current.at < 2000
      ) {
        return true;
      }

      try {
        const data = await recordProductView(authToken, productId);
        lastRecordedRef.current = { productId: idStr, at: now };
        syncFromResponse(data);
        return true;
      } catch (err) {
        console.error('Ko‘rilgan mahsulot saqlanmadi:', err);
        return false;
      }
    },
    [authToken, syncFromResponse],
  );

  const value = {
    items,
    recentProductIds,
    recordView,
    refreshViewed: loadViewed,
  };

  return (
    <ViewedAtContext.Provider value={value}>
      {children}
    </ViewedAtContext.Provider>
  );
};
