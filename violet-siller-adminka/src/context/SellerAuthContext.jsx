import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TOKEN_KEY = 'seller_auth_token';
const SELLER_KEY = 'seller_auth_profile';
export const REGISTRATION_TOKEN_KEY = 'seller_registration_token';

const SellerAuthContext = createContext(null);

function readStoredSeller() {
  try {
    const raw = localStorage.getItem(SELLER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SellerAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [seller, setSeller] = useState(() => readStoredSeller());

  const login = useCallback((nextToken, nextSeller) => {
    setToken(nextToken);
    setSeller(nextSeller);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(SELLER_KEY, JSON.stringify(nextSeller));
  }, []);

  const logout = useCallback((options = {}) => {
    const clearRegistration = options?.clearRegistration === true;

    setToken('');
    setSeller(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SELLER_KEY);

    if (clearRegistration) {
      localStorage.removeItem(REGISTRATION_TOKEN_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      seller,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, seller, login, logout],
  );

  return <SellerAuthContext.Provider value={value}>{children}</SellerAuthContext.Provider>;
}

export function useSellerAuth() {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth faqat SellerAuthProvider ichida ishlatiladi');
  }
  return context;
}
