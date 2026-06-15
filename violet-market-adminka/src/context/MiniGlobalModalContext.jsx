import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import MiniGlobalModal from '../components/MiniGlobalModal/MiniGlobalModal';

const MiniGlobalModalContext = createContext({
  openMiniGlobalModal: () => {},
  closeMiniGlobalModal: () => {},
});

export function useMiniGlobalModal() {
  return useContext(MiniGlobalModalContext);
}

export function MiniGlobalModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    open: false,
    permissionKey: '',
    itemName: '',
    loading: false,
  });

  const onConfirmRef = useRef(null);

  const closeMiniGlobalModal = useCallback(() => {
    setModalState((current) => {
      if (current.loading) return current;
      onConfirmRef.current = null;
      return {
        open: false,
        permissionKey: '',
        itemName: '',
        loading: false,
      };
    });
  }, []);

  const openMiniGlobalModal = useCallback(({ permissionKey, itemName = '', onConfirm }) => {
    onConfirmRef.current = typeof onConfirm === 'function' ? onConfirm : null;
    setModalState({
      open: true,
      permissionKey: String(permissionKey || '').trim(),
      itemName: String(itemName || '').trim(),
      loading: false,
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const confirmAction = onConfirmRef.current;
    if (!confirmAction) {
      closeMiniGlobalModal();
      return;
    }

    setModalState((current) => ({ ...current, loading: true }));

    try {
      await confirmAction();
      onConfirmRef.current = null;
      setModalState({
        open: false,
        permissionKey: '',
        itemName: '',
        loading: false,
      });
    } catch (_error) {
      setModalState((current) => ({ ...current, loading: false }));
    }
  }, [closeMiniGlobalModal]);

  const contextValue = useMemo(
    () => ({
      openMiniGlobalModal,
      closeMiniGlobalModal,
    }),
    [openMiniGlobalModal, closeMiniGlobalModal],
  );

  return (
    <MiniGlobalModalContext.Provider value={contextValue}>
      {children}
      <MiniGlobalModal
        open={modalState.open}
        permissionKey={modalState.permissionKey}
        itemName={modalState.itemName}
        loading={modalState.loading}
        onConfirm={handleConfirm}
        onCancel={closeMiniGlobalModal}
      />
    </MiniGlobalModalContext.Provider>
  );
}

export default MiniGlobalModalContext;
