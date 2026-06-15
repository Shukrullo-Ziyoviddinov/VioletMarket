import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import AdminToast from '../components/AdminToast/AdminToast';

const AdminToastContext = createContext({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  hideToast: () => {},
});

export function useAdminToast() {
  return useContext(AdminToastContext);
}

export function AdminToastProvider({ children }) {
  const [toastState, setToastState] = useState({
    open: false,
    type: 'info',
    message: '',
  });

  const hideToast = useCallback(() => {
    setToastState((current) => ({ ...current, open: false }));
  }, []);

  const showToast = useCallback(({ type = 'info', message = '' }) => {
    const text = String(message || '').trim();
    if (!text) return;

    setToastState({
      open: true,
      type,
      message: text,
    });
  }, []);

  const showSuccess = useCallback(
    (message) => showToast({ type: 'success', message }),
    [showToast],
  );

  const showError = useCallback(
    (message) => showToast({ type: 'error', message }),
    [showToast],
  );

  const showWarning = useCallback(
    (message) => showToast({ type: 'warning', message }),
    [showToast],
  );

  const showInfo = useCallback(
    (message) => showToast({ type: 'info', message }),
    [showToast],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideToast,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, hideToast],
  );

  return (
    <AdminToastContext.Provider value={contextValue}>
      {children}
      <AdminToast
        open={toastState.open}
        type={toastState.type}
        message={toastState.message}
        onClose={hideToast}
      />
    </AdminToastContext.Provider>
  );
}

export default AdminToastContext;
