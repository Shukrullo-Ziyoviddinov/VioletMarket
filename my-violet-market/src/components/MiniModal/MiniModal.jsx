import React, { useEffect } from 'react';
import './MiniModal.css';

export default function MiniModal({
  open = false,
  onClose,
  align = 'bottom-end',
  children,
  className = '',
  labelledBy,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`mini-modal-host mini-modal-host--${align}`} role="presentation">
      <button type="button" className="mini-modal-host__backdrop" onClick={onClose} aria-label="Yopish" />
      <div
        className={`mini-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}
