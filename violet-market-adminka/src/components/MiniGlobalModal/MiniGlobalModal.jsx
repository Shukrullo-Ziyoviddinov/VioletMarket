import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SellerProductSaleDatesModalContent from '../SellerProductSaleDatesModalContent/SellerProductSaleDatesModalContent';
import { resolveMiniGlobalModalPermission } from './miniGlobalModalTexts';
import './MiniGlobalModal.css';

const VIEW_COMPONENTS = {
  'seller-product-sale-dates': SellerProductSaleDatesModalContent,
};

export default function MiniGlobalModal({
  open = false,
  mode = 'confirm',
  permissionKey = '',
  itemName = '',
  viewKey = '',
  viewTitle = '',
  viewProps = {},
  loading = false,
  onConfirm,
  onCancel,
}) {
  const copy = useMemo(
    () => resolveMiniGlobalModalPermission(permissionKey, itemName),
    [permissionKey, itemName],
  );

  const ViewComponent = VIEW_COMPONENTS[viewKey] || null;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  if (mode === 'view') {
    return createPortal(
      <div className="mini-global-modal" role="presentation">
        <button
          type="button"
          className="mini-global-modal__backdrop"
          aria-label="Yopish"
          onClick={loading ? undefined : onCancel}
          disabled={loading}
        />

        <div className="mini-global-modal__center">
          <div
            className="mini-global-modal__dialog mini-global-modal__dialog--view"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mini-global-modal-title"
          >
            <h2 id="mini-global-modal-title" className="mini-global-modal__title">
              {viewTitle || 'Ma\'lumot'}
            </h2>

            {ViewComponent ? <ViewComponent {...viewProps} /> : null}

            <div className="mini-global-modal__actions mini-global-modal__actions--single">
              <button
                type="button"
                className="mini-global-modal__btn mini-global-modal__btn--ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="mini-global-modal" role="presentation">
      <button
        type="button"
        className="mini-global-modal__backdrop"
        aria-label="Yopish"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />

      <div className="mini-global-modal__center">
        <div
          className="mini-global-modal__dialog"
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

          <div className="mini-global-modal__actions">
            <button
              type="button"
              className="mini-global-modal__btn mini-global-modal__btn--ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {copy.cancelText}
            </button>
            <button
              type="button"
              className="mini-global-modal__btn mini-global-modal__btn--danger"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'O\'chirilmoqda...' : copy.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
