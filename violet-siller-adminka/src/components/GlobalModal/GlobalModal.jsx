import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './GlobalModal.css';

export default function GlobalModal({
  open = false,
  title = '',
  onClose,
  children,
}) {
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
    <div className="global-modal" role="presentation">
      <button
        type="button"
        className="global-modal__backdrop"
        aria-label="Yopish"
        onClick={onClose}
      />

      <div className="global-modal__center">
        <div
          className="global-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-modal-title"
        >
          <header className="global-modal__header">
            <h2 id="global-modal-title" className="global-modal__title">
              {title}
            </h2>
            <button type="button" className="global-modal__close" onClick={onClose} aria-label="Yopish">
              ×
            </button>
          </header>

          <div className="global-modal__body">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
