import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from './UserContext';
import { useToast } from './ToastContext';
import {
  fetchSearchHistory,
  addSearchHistoryQuery,
  removeSearchHistoryQuery,
} from '../api/searchApi';

const SearchHistoryContext = createContext();

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  }
  return context;
};

export const SearchHistoryProvider = ({ children }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { authToken, userData } = useUser();
  const [recentSearchQueries, setRecentSearchQueries] = useState([]);
  const [loading, setLoading] = useState(false);

  const syncFromResponse = useCallback((data) => {
    if (!data) return;
    if (Array.isArray(data.queries)) setRecentSearchQueries(data.queries);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!authToken) {
      setRecentSearchQueries([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSearchHistory(authToken);
      syncFromResponse(data);
    } catch (err) {
      console.error('Qidiruv tarixi yuklanmadi:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, syncFromResponse]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, userData.id]);

  useEffect(() => {
    localStorage.removeItem('violet_search_history');
    localStorage.removeItem('violet_search_query_history');
  }, []);

  const addSearchQuery = useCallback(
    async (q) => {
      const trimmed = (q || '').trim();
      if (!trimmed) return false;
      if (!authToken) {
        showToast(t('search.loginRequired'), 'info');
        return false;
      }
      try {
        const data = await addSearchHistoryQuery(authToken, trimmed);
        syncFromResponse(data);
        return true;
      } catch (err) {
        console.error('Qidiruv tarixi saqlanmadi:', err);
        showToast(t('search.saveError'), 'error');
        return false;
      }
    },
    [authToken, showToast, syncFromResponse, t],
  );

  const applyHistoryFromSearchResponse = useCallback(
    (data) => {
      if (data?.queries) syncFromResponse(data);
    },
    [syncFromResponse],
  );

  const removeSearchQuery = useCallback(
    async (q) => {
      if (!authToken) return;
      try {
        const data = await removeSearchHistoryQuery(authToken, q);
        syncFromResponse(data);
      } catch (err) {
        console.error('Qidiruv tarixi o\'chirilmadi:', err);
        showToast(t('search.saveError'), 'error');
      }
    },
    [authToken, showToast, syncFromResponse, t],
  );

  const value = {
    recentSearchQueries,
    loading,
    addSearchQuery,
    removeSearchQuery,
    applyHistoryFromSearchResponse,
    refreshHistory: loadHistory,
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};
