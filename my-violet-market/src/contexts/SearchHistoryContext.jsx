import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'violet_search_history';
const QUERY_STORAGE_KEY = 'violet_search_query_history';
const MAX_HISTORY = 20;
const MAX_QUERY_HISTORY = 15;

const SearchHistoryContext = createContext();

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  }
  return context;
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {}
};

const loadQueryHistory = () => {
  try {
    const raw = localStorage.getItem(QUERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_QUERY_HISTORY) : [];
  } catch {
    return [];
  }
};

const saveQueryHistory = (items) => {
  try {
    localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_QUERY_HISTORY)));
  } catch {}
};

export const SearchHistoryProvider = ({ children }) => {
  const [recentProductIds, setRecentProductIds] = useState(loadFromStorage);
  const [recentSearchQueries, setRecentSearchQueries] = useState(loadQueryHistory);

  useEffect(() => {
    saveToStorage(recentProductIds);
  }, [recentProductIds]);

  useEffect(() => {
    saveQueryHistory(recentSearchQueries);
  }, [recentSearchQueries]);

  const addProduct = useCallback((product) => {
    if (!product?.id) return;
    setRecentProductIds((prev) => {
      const next = [product.id, ...prev.filter((id) => id !== product.id)];
      return next.slice(0, MAX_HISTORY);
    });
  }, []);

  const addSearchQuery = useCallback((q) => {
    const trimmed = (q || '').trim();
    if (!trimmed) return;
    setRecentSearchQueries((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)];
      return next.slice(0, MAX_QUERY_HISTORY);
    });
  }, []);

  const removeSearchQuery = useCallback((q) => {
    setRecentSearchQueries((prev) => prev.filter((item) => item !== q));
  }, []);

  const getRecentProductIds = useCallback(() => recentProductIds, [recentProductIds]);

  const clearHistory = useCallback(() => setRecentProductIds([]), []);

  const value = {
    recentProductIds,
    addProduct,
    getRecentProductIds,
    clearHistory,
    recentSearchQueries,
    addSearchQuery,
    removeSearchQuery,
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};
