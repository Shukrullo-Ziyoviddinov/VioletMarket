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
  openMiniGlobalViewModal: () => {},
  closeMiniGlobalModal: () => {},
});

export function useMiniGlobalModal() {
  return useContext(MiniGlobalModalContext);
}

const EMPTY_VIEW_PROPS = {};

export function MiniGlobalModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'confirm',
    permissionKey: '',
    itemName: '',
    viewKey: '',
    viewTitle: '',
    viewProps: EMPTY_VIEW_PROPS,
    loading: false,
  });

  const onConfirmRef = useRef(null);

  const closeMiniGlobalModal = useCallback(() => {
    setModalState((current) => {
      if (current.loading) return current;
      onConfirmRef.current = null;
      return {
        open: false,
        mode: 'confirm',
        permissionKey: '',
        itemName: '',
        viewKey: '',
        viewTitle: '',
        viewProps: EMPTY_VIEW_PROPS,
        loading: false,
      };
    });
  }, []);

  const openMiniGlobalModal = useCallback(({ permissionKey, itemName = '', onConfirm }) => {
    onConfirmRef.current = typeof onConfirm === 'function' ? onConfirm : null;
    setModalState({
      open: true,
      mode: 'confirm',
      permissionKey: String(permissionKey || '').trim(),
      itemName: String(itemName || '').trim(),
      viewKey: '',
      viewTitle: '',
      viewProps: EMPTY_VIEW_PROPS,
      loading: false,
    });
  }, []);

  const openMiniGlobalViewModal = useCallback(({ viewKey, viewTitle = '', viewProps = {} }) => {
    onConfirmRef.current = null;
    setModalState({
      open: true,
      mode: 'view',
      permissionKey: '',
      itemName: '',
      viewKey: String(viewKey || '').trim(),
      viewTitle: String(viewTitle || '').trim(),
      viewProps: viewProps && typeof viewProps === 'object' ? viewProps : EMPTY_VIEW_PROPS,
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
        mode: 'confirm',
        permissionKey: '',
        itemName: '',
        viewKey: '',
        viewTitle: '',
        viewProps: EMPTY_VIEW_PROPS,
        loading: false,
      });
    } catch (_error) {
      setModalState((current) => ({ ...current, loading: false }));
    }
  }, [closeMiniGlobalModal]);

  const contextValue = useMemo(
    () => ({
      openMiniGlobalModal,
      openMiniGlobalViewModal,
      closeMiniGlobalModal,
    }),
    [openMiniGlobalModal, openMiniGlobalViewModal, closeMiniGlobalModal],
  );

  return (
    <MiniGlobalModalContext.Provider value={contextValue}>
      {children}
      <MiniGlobalModal
        open={modalState.open}
        mode={modalState.mode}
        permissionKey={modalState.permissionKey}
        itemName={modalState.itemName}
        viewKey={modalState.viewKey}
        viewTitle={modalState.viewTitle}
        viewProps={modalState.viewProps}
        loading={modalState.loading}
        onConfirm={handleConfirm}
        onCancel={closeMiniGlobalModal}
      />
    </MiniGlobalModalContext.Provider>
  );
}

export default MiniGlobalModalContext;
