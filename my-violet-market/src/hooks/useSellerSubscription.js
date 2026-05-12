import { useState, useEffect, useCallback } from 'react';

export const SELLER_SUBSCRIBE_STORAGE_PREFIX = 'seller_subscribed:';

const storageKey = (sellerId) => `${SELLER_SUBSCRIBE_STORAGE_PREFIX}${sellerId}`;

/** localStorage dan obuna bo'lgan sotuvchi idlari */
export function getSubscribedSellerIds() {
  try {
    const ids = [];
    const len = localStorage.length;
    for (let i = 0; i < len; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(SELLER_SUBSCRIBE_STORAGE_PREFIX) && localStorage.getItem(k) === '1') {
        ids.push(k.slice(SELLER_SUBSCRIBE_STORAGE_PREFIX.length));
      }
    }
    return ids;
  } catch {
    return [];
  }
}

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
