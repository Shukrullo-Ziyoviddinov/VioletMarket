import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getPortalContainer } from '../../utils/utils';
import './GlobalModal.css';

const MOBILE_MAX = 767;

const useIsMobileViewport = () => {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return mobile;
};

/**
 * Umumiy modal: desktopda markazda, mobilda pastdan sheet; mobil drag bilan yopiladi.
 */
const GlobalModal = ({ isOpen, onClose, title, children }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobileViewport();
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const [dragY, setDragY] = useState(0);

  const onTouchStart = useCallback(
    (e) => {
      if (!isMobile) return;
      startYRef.current = e.touches[0].clientY;
      setDragY(0);
    },
    [isMobile]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!isMobile) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) setDragY(diff);
    },
    [isMobile]
  );

  const onTouchEnd = useCallback(() => {
    if (!isMobile) return;
    const threshold = window.innerHeight * 0.12;
    if (dragY >= threshold) onClose();
    setDragY(0);
  }, [isMobile, dragY, onClose]);

  useEffect(() => {
    if (!isOpen || !isMobile || !handleRef.current) return;
    const el = handleRef.current;
    const prevent = (e) => {
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setDragY(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const sheetStyle =
    isMobile && dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined;

  const node = (
    <div className="global-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`global-modal${isMobile ? ' global-modal--sheet' : ''}`}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'global-modal-title' : undefined}
      >
        {isMobile && (
          <div
            ref={handleRef}
            className="global-modal__drag-zone"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="global-modal__handle" aria-hidden />
          </div>
        )}
        <div className="global-modal__top">
          {title ? (
            <h2 id="global-modal-title" className="global-modal__title">
              {title}
            </h2>
          ) : (
            <span className="global-modal__title-spacer" />
          )}
          <button
            type="button"
            className="global-modal__close"
            onClick={onClose}
            aria-label={t('globalModal.close')}
          >
            <i className="bx bx-x" aria-hidden />
          </button>
        </div>
        <div className="global-modal__body">{children}</div>
      </div>
    </div>
  );

  return createPortal(node, getPortalContainer());
};

export default GlobalModal;
