import React, { useEffect, useMemo } from 'react';
import { resolveMiniGlobalModalPermission } from './miniGlobalModalTexts';
import './MiniGlobalModal.css';

export default function MiniGlobalModal({
  open = false,
  permissionKey = '',
  itemName = '',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const copy = useMemo(
    () => resolveMiniGlobalModalPermission(permissionKey, itemName),
    [permissionKey, itemName],
  );

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

  return (
    <div className="mini-global-modal" role="presentation">
      <button
        type="button"
        className="mini-global-modal__backdrop"
        aria-label="Yopish"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />

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
        <p id="mini-global-modal-message" className="mini-global-modal__message">
          {copy.message}
        </p>

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
  );
}
