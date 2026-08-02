import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import SellerAccountPausedNotice from '../SellerAccountPausedNotice/SellerAccountPausedNotice';
import './MiniGlobalModal.css';

const VARIANT_META = {
  'seller-paused': {
    titleKey: 'miniGlobalModal.sellerPausedTitle',
    Content: SellerAccountPausedNotice,
  },
};

function MiniGlobalModalConfirm({
  open,
  permissionKey,
  itemName,
  loading,
  onConfirm,
  onCancel,
  onCancelOrder,
  cancelOrderLoading = false,
  cancelOrderText,
  extraContent = null,
}) {
  const { t } = useTranslation();
  const permissionPath = [
    'deleteProduct',
    'courierHandoff',
    'cargoHandoff',
    'cancelOrder',
    'markUnavailable',
  ].includes(permissionKey)
    ? permissionKey
    : 'default';

  const copy = useMemo(
    () => ({
      title: t(`miniGlobalModal.${permissionPath}.title`),
      message: t(`miniGlobalModal.${permissionPath}.message`, {
        itemName: itemName || '',
      }),
      confirmText: t(`miniGlobalModal.${permissionPath}.confirm`),
      cancelText: t(`miniGlobalModal.${permissionPath}.cancel`),
    }),
    [itemName, permissionPath, t],
  );
  const busy = loading || cancelOrderLoading;
  const resolvedCancelOrderText =
    cancelOrderText || t('orders.modal.cancelOrder');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        onCancel?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="mini-global-modal" role="presentation">
      <button
        type="button"
        className="mini-global-modal__backdrop"
        aria-label={t('miniGlobalModal.close')}
        onClick={busy ? undefined : onCancel}
        disabled={busy}
      />

      <div className="mini-global-modal__center">
        <div
          className={`mini-global-modal__dialog mini-global-modal__dialog--confirm${
            extraContent ? ' mini-global-modal__dialog--with-extra' : ''
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mini-global-modal-title"
          aria-describedby="mini-global-modal-message"
        >
          <h2 id="mini-global-modal-title" className="mini-global-modal__title">
            {copy.title}
          </h2>
          {copy.message ? (
            <p id="mini-global-modal-message" className="mini-global-modal__message">
              {copy.message}
            </p>
          ) : null}

          {extraContent}

          <div
            className={`mini-global-modal__actions${
              onCancelOrder ? ' mini-global-modal__actions--with-cancel-order' : ''
            }`}
          >
            {onCancelOrder ? (
              <button
                type="button"
                className="mini-global-modal__btn mini-global-modal__btn--cancel-order"
                onClick={onCancelOrder}
                disabled={busy}
              >
                {cancelOrderLoading
                  ? t('orders.modal.cancelling')
                  : resolvedCancelOrderText}
              </button>
            ) : null}
            <div className="mini-global-modal__actions-right">
              <button
                type="button"
                className="mini-global-modal__btn mini-global-modal__btn--ghost"
                onClick={onCancel}
                disabled={busy}
              >
                {copy.cancelText}
              </button>
              <button
                type="button"
                className="mini-global-modal__btn mini-global-modal__btn--danger"
                onClick={onConfirm}
                disabled={busy}
              >
                {loading ? t('miniGlobalModal.confirming') : copy.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MiniGlobalModalVariant({ open, onClose, variant }) {
  const { t } = useTranslation();
  const meta = VARIANT_META[variant] || VARIANT_META['seller-paused'];
  const Content = meta.Content;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="mini-global-modal" role="presentation">
      <button
        type="button"
        className="mini-global-modal__backdrop"
        aria-label={t('miniGlobalModal.close')}
        onClick={onClose}
      />

      <div className="mini-global-modal__center">
        <div
          className="mini-global-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mini-global-modal-title"
        >
          <header className="mini-global-modal__header">
            <h2 id="mini-global-modal-title" className="mini-global-modal__title">
              {t(meta.titleKey)}
            </h2>
            <button
              type="button"
              className="mini-global-modal__close"
              onClick={onClose}
              aria-label={t('miniGlobalModal.close')}
            >
              ×
            </button>
          </header>

          <div className="mini-global-modal__body">
            <Content />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function MiniGlobalModal({
  open = false,
  onClose,
  variant = 'seller-paused',
  permissionKey = '',
  itemName = '',
  loading = false,
  onConfirm,
  onCancelOrder,
  cancelOrderLoading = false,
  cancelOrderText,
  extraContent = null,
}) {
  const isConfirmMode = Boolean(permissionKey);

  if (isConfirmMode) {
    return (
      <MiniGlobalModalConfirm
        open={open}
        permissionKey={permissionKey}
        itemName={itemName}
        loading={loading}
        onConfirm={onConfirm}
        onCancel={onClose}
        onCancelOrder={onCancelOrder}
        cancelOrderLoading={cancelOrderLoading}
        cancelOrderText={cancelOrderText}
        extraContent={extraContent}
      />
    );
  }

  return <MiniGlobalModalVariant open={open} onClose={onClose} variant={variant} />;
}
