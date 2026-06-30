import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import './MiniModal.css';

export default function MiniModal({
  open = false,
  onClose,
  align = 'bottom-end',
  children,
  className = '',
  labelledBy,
  viewportBackdrop = false,
  anchorRef = null,
}) {
  const [menuStyle, setMenuStyle] = useState({});

  useLayoutEffect(() => {
    if (!open || !viewportBackdrop || align !== 'bottom-end' || !anchorRef?.current) {
      setMenuStyle({});
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: `${Math.min(rect.bottom + 4, window.innerHeight - 8)}px`,
        right: `${Math.max(8, window.innerWidth - rect.right)}px`,
        left: 'auto',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, viewportBackdrop, align, anchorRef]);

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

  const content = (
    <div
      className={`mini-modal-host mini-modal-host--${align}${viewportBackdrop ? ' mini-modal-host--viewport' : ''}`}
      role="presentation"
    >
      <button type="button" className="mini-modal-host__backdrop" onClick={onClose} aria-label="Yopish" />
      <div
        className={`mini-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={viewportBackdrop ? menuStyle : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  if (viewportBackdrop) {
    return createPortal(content, getPortalContainer());
  }

  return content;
}
