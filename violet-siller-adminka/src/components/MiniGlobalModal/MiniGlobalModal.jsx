import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import SellerAccountPausedNotice from '../SellerAccountPausedNotice/SellerAccountPausedNotice';
import './MiniGlobalModal.css';

const VARIANT_META = {
  'seller-paused': {
    title: "Hisob to'xtatilgan",
    Content: SellerAccountPausedNotice,
  },
};

export default function MiniGlobalModal({ open = false, onClose, variant = 'seller-paused' }) {
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
        aria-label="Yopish"
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
              {meta.title}
            </h2>
            <button
              type="button"
              className="mini-global-modal__close"
              onClick={onClose}
              aria-label="Yopish"
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
