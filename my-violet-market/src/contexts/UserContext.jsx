import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchProfile } from '../api/profileApi';
import { mapApiUserToClient } from '../api/mapApiUser';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=';

const defaultUserData = {
  id: null,
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: '',
  sellerAccountId: null,
  language: 'uz',
  profileImage: DEFAULT_AVATAR,
  hasUploadedImage: false,
  isAuthenticated: false,
};

const normalizeSavedUserData = (saved) => {
  if (!saved || typeof saved !== 'object') return { ...defaultUserData };
  const next = { ...defaultUserData };
  for (const key of Object.keys(defaultUserData)) {
    if (key in saved && saved[key] !== undefined) {
      next[key] = saved[key];
    }
  }
  return next;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(defaultUserData);
  const [authToken, setAuthToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedData = localStorage.getItem('userData');
    let parsed = null;
    if (savedData) {
      try {
        parsed = normalizeSavedUserData(JSON.parse(savedData));
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    }
    if (!savedToken) {
      if (parsed) setUserData(parsed);
      setAuthLoading(false);
      return;
    }
    setAuthToken(savedToken);
    if (parsed) setUserData(parsed);
    fetchProfile(savedToken)
      .then((res) => {
        const mapped = mapApiUserToClient(res.user);
        if (mapped) setUserData(mapped);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUserData(defaultUserData);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    if (authToken) localStorage.setItem('authToken', authToken);
    else localStorage.removeItem('authToken');
  }, [authToken]);

  const setSession = useCallback((token, apiUser) => {
    const mapped = mapApiUserToClient(apiUser);
    if (!mapped) return;
    setAuthToken(token);
    setUserData(mapped);
  }, []);

  const updateUserData = useCallback((newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
  }, []);

  const logout = useCallback(() => {
    setUserData(defaultUserData);
    setAuthToken(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('wishlist');
  }, []);

  const value = {
    userData,
    authToken,
    authLoading,
    setSession,
    updateUserData,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
