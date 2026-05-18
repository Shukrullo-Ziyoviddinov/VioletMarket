import { useCallback, useEffect } from 'react';
import { useSellerSubscriptions } from '../contexts/SellerSubscriptionContext';

/**
 * Sotuvchi obunasi — server (DB) orqali.
 * @param {string} sellerId
 * @param {number} [fallbackSubscriberCount] — API yuklanmaguncha ko‘rsatiladigan son
 */
export function useSellerSubscription(sellerId, fallbackSubscriberCount = 0) {
  const {
    loadSellerStatus,
    toggleSubscription,
    getSellerSubscriptionState,
  } = useSellerSubscriptions();

  const fallback = Number(fallbackSubscriberCount) || 0;
  const { subscriberCount, subscribed, loading } = getSellerSubscriptionState(
    sellerId,
    fallback,
  );

  useEffect(() => {
    if (!sellerId) return;
    loadSellerStatus(sellerId, fallback);
  }, [sellerId, fallback, loadSellerStatus]);

  const toggle = useCallback(() => {
    if (!sellerId) return;
    return toggleSubscription(sellerId);
  }, [sellerId, toggleSubscription]);

  return {
    displayCount: subscriberCount,
    subscribed,
    toggle,
    loading,
  };
}
