import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

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
  const beforeCloseRef = useRef(null);

  const openModal = (options = {}) => {
    setOnCloseExtra(options.onCloseExtra || null);
    setCartSnapshot(options.cartSnapshot || null);
    setIsOpen(true);
  };

  const scheduleOpenOnHome = (options = {}) => {
    // SOTILDI MODAL (.test-order-modal-content) — ochilishni rejalashtirish (hozir checkout).
    setPendingOpenOnHome({
      cartSnapshot: options.cartSnapshot || null,
      onCloseExtra: options.onCloseExtra || null,
    });
  };

  const clearPendingOpenOnHome = () => {
    setPendingOpenOnHome(null);
  };

  const registerBeforeClose = useCallback((fn) => {
    beforeCloseRef.current = typeof fn === 'function' ? fn : null;
  }, []);

  const closeModal = useCallback(async () => {
    const beforeClose = beforeCloseRef.current;
    beforeCloseRef.current = null;
    if (beforeClose) {
      try {
        await beforeClose();
      } catch (err) {
        console.error('Test order modal beforeClose:', err);
      }
    }
    const extra = onCloseExtra;
    setOnCloseExtra(null);
    setCartSnapshot(null);
    setIsOpen(false);
    if (extra && typeof extra === 'function') {
      queueMicrotask(() => extra());
    }
  }, [onCloseExtra]);

  const value = {
    isOpen,
    openModal,
    closeModal,
    registerBeforeClose,
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
