import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from './UserContext';
import { useToast } from './ToastContext';
import {
  fetchMySellerSubscriptions,
  fetchSellerSubscriptionStatus,
  toggleSellerSubscription,
} from '../api/sellerSubscriptionApi';

const SellerSubscriptionContext = createContext(null);

export const useSellerSubscriptions = () => {
  const ctx = useContext(SellerSubscriptionContext);
  if (!ctx) {
    throw new Error('useSellerSubscriptions faqat SellerSubscriptionProvider ichida ishlatiladi');
  }
  return ctx;
};

const sellerIdKey = (id) => String(id ?? '').trim();

export const SellerSubscriptionProvider = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { authToken, userData } = useUser();

  const [subscribedSellerIds, setSubscribedSellerIds] = useState(() => new Set());
  const [statusBySeller, setStatusBySeller] = useState({});
  const [loadingMine, setLoadingMine] = useState(false);

  const syncMineFromResponse = useCallback((data) => {
    const ids = new Set((data.sellerIds || []).map(sellerIdKey));
    setSubscribedSellerIds(ids);
  }, []);

  const patchSellerStatus = useCallback((sellerId, patch) => {
    const key = sellerIdKey(sellerId);
    if (!key) return;
    setStatusBySeller((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }, []);

  const loadMySubscriptions = useCallback(async () => {
    if (!authToken) {
      setSubscribedSellerIds(new Set());
      return;
    }
    setLoadingMine(true);
    try {
      const data = await fetchMySellerSubscriptions(authToken);
      syncMineFromResponse(data);
    } catch (err) {
      console.error('Obunalar yuklanmadi:', err);
    } finally {
      setLoadingMine(false);
    }
  }, [authToken, syncMineFromResponse]);

  useEffect(() => {
    loadMySubscriptions();
  }, [loadMySubscriptions, userData.id]);

  const loadSellerStatus = useCallback(
    async (sellerId, fallbackCount = 0) => {
      const key = sellerIdKey(sellerId);
      if (!key) return null;

      setStatusBySeller((prev) => ({
        ...prev,
        [key]: {
          subscriberCount: prev[key]?.subscriberCount ?? fallbackCount,
          subscribed: prev[key]?.subscribed ?? subscribedSellerIds.has(key),
          loading: true,
        },
      }));

      try {
        const data = await fetchSellerSubscriptionStatus(key, authToken);
        const next = {
          subscriberCount: Number(data.subscriberCount) || 0,
          subscribed: Boolean(data.subscribed),
          loading: false,
        };
        patchSellerStatus(key, next);
        if (authToken) {
          setSubscribedSellerIds((prev) => {
            const copy = new Set(prev);
            if (next.subscribed) copy.add(key);
            else copy.delete(key);
            return copy;
          });
        }
        return next;
      } catch (err) {
        console.error('Sotuvchi obuna holati yuklanmadi:', err);
        patchSellerStatus(key, { subscriberCount: fallbackCount, loading: false });
        return null;
      }
    },
    [authToken, patchSellerStatus],
  );

  const toggleSubscription = useCallback(
    async (sellerId) => {
      const key = sellerIdKey(sellerId);
      if (!key) return null;

      if (!authToken) {
        showToast(t('seller.loginRequired'), 'info');
        navigate('/login');
        return null;
      }

      try {
        const data = await toggleSellerSubscription(authToken, key);
        const next = {
          subscriberCount: Number(data.subscriberCount) || 0,
          subscribed: Boolean(data.subscribed),
          loading: false,
        };
        patchSellerStatus(key, next);
        syncMineFromResponse(data);
        return next;
      } catch (err) {
        console.error('Obuna almashtirilmadi:', err);
        if (err.status === 401) {
          showToast(t('seller.loginRequired'), 'info');
          navigate('/login');
        }
        return null;
      }
    },
    [authToken, navigate, patchSellerStatus, showToast, syncMineFromResponse, t],
  );

  const getSellerSubscriptionState = useCallback(
    (sellerId, fallbackCount = 0) => {
      const key = sellerIdKey(sellerId);
      const cached = statusBySeller[key];
      return {
        subscriberCount: cached?.subscriberCount ?? fallbackCount,
        subscribed: cached?.subscribed ?? subscribedSellerIds.has(key),
        loading: Boolean(cached?.loading),
      };
    },
    [statusBySeller, subscribedSellerIds],
  );

  const value = useMemo(
    () => ({
      subscribedSellerIds,
      loadingMine,
      loadMySubscriptions,
      loadSellerStatus,
      toggleSubscription,
      getSellerSubscriptionState,
    }),
    [
      subscribedSellerIds,
      loadingMine,
      loadMySubscriptions,
      loadSellerStatus,
      toggleSubscription,
      getSellerSubscriptionState,
    ],
  );

  return (
    <SellerSubscriptionContext.Provider value={value}>
      {children}
    </SellerSubscriptionContext.Provider>
  );
};
