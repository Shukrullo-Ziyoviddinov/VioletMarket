import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const defaultUserData = {
  firstName: '',
  lastName: '',
  phone: '',
  /** ISO YYYY-MM-DD yoki '' */
  birthDate: '',
  /** 'male' | 'female' | '' */
  gender: '',
  /** Sotuvchi kabineti: sellerData dagi id (masalan 'violet'). null — oddiy mijoz. */
  sellerAccountId: null,
  language: 'uz',
  profileImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=',
  hasUploadedImage: false,
  /** Backend sessiyasi (keyinchalik token bilan almashtiriladi) */
  isAuthenticated: false,
};

/** localStorage dagi eski yozuvlarni (masalan username) yangi shaklga moslashtirish */
const normalizeSavedUserData = (saved) => {
  if (!saved || typeof saved !== 'object') return { ...defaultUserData };
  const next = { ...defaultUserData };
  for (const key of Object.keys(defaultUserData)) {
    if (key in saved && saved[key] !== undefined) {
      next[key] = saved[key];
    }
  }
  if (!('isAuthenticated' in saved)) {
    const phoneOk = String(saved.phone || '').replace(/\D/g, '').length >= 9;
    const nameOk = String(saved.firstName || '').trim().length > 0;
    if (phoneOk && nameOk) next.isAuthenticated = true;
  }
  return next;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(defaultUserData);

  // LocalStorage dan yuklash
  useEffect(() => {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      try {
        setUserData(normalizeSavedUserData(JSON.parse(savedData)));
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    }
  }, []);

  // LocalStorage ga saqlash
  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  // Ma'lumotlarni yangilash
  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  // Logout
  const logout = () => {
    setUserData(defaultUserData);
    localStorage.removeItem('userData');
  };

  const value = {
    userData,
    updateUserData,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

