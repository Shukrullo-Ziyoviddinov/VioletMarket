import { useState, useEffect, useCallback } from 'react';

const storageKey = (sellerId) => `seller_subscribed:${sellerId}`;

/**
 * Sotuvchi obunasi: localStorage (demo). Obuna bo'lganda ko'rsatiladigan son +1.
 */
export function useSellerSubscription(sellerId, baseSubscriberCount) {
  const base = Number(baseSubscriberCount) || 0;
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    try {
      setSubscribed(localStorage.getItem(storageKey(sellerId)) === '1');
    } catch {
      setSubscribed(false);
    }
  }, [sellerId]);

  const toggle = useCallback(() => {
    if (!sellerId) return;
    setSubscribed((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(storageKey(sellerId), '1');
        else localStorage.removeItem(storageKey(sellerId));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [sellerId]);

  const displayCount = base + (subscribed ? 1 : 0);

  return { displayCount, subscribed, toggle };
}
