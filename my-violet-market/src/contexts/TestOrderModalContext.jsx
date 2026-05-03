import React, { createContext, useContext, useState } from 'react';

const TestOrderModalContext = createContext();

export const useTestOrderModal = () => {
  const context = useContext(TestOrderModalContext);
  if (!context) {
    throw new Error('useTestOrderModal must be used within a TestOrderModalProvider');
  }
  return context;
};

export const TestOrderModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [onCloseExtra, setOnCloseExtra] = useState(null);
  const [cartSnapshot, setCartSnapshot] = useState(null);
  const [pendingOpenOnHome, setPendingOpenOnHome] = useState(null);

  const openModal = (options = {}) => {
    setOnCloseExtra(options.onCloseExtra || null);
    setCartSnapshot(options.cartSnapshot || null);
    setIsOpen(true);
  };

  const scheduleOpenOnHome = (options = {}) => {
    setPendingOpenOnHome({
      cartSnapshot: options.cartSnapshot || null,
      onCloseExtra: options.onCloseExtra || null,
    });
  };

  const clearPendingOpenOnHome = () => {
    setPendingOpenOnHome(null);
  };

  const closeModal = () => {
    const extra = onCloseExtra;
    setOnCloseExtra(null);
    setCartSnapshot(null);
    setIsOpen(false);
    if (extra && typeof extra === 'function') {
      queueMicrotask(() => extra());
    }
  };

  const value = {
    isOpen,
    openModal,
    closeModal,
    cartSnapshot,
    pendingOpenOnHome,
    scheduleOpenOnHome,
    clearPendingOpenOnHome,
  };

  return (
    <TestOrderModalContext.Provider value={value}>
      {children}
    </TestOrderModalContext.Provider>
  );
};
