import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ColorFilter.css';

const MOBILE_BREAKPOINT = 768;

const ColorFilter = ({ isOpen, onClose, onApply, availableColors, selectedColors, setSelectedColors }) => {
  const { i18n } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const options = [...availableColors].sort();
  const hasSelection = selectedColors.length > 0;

  const toggle = (colorName) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((v) => v !== colorName) : [...prev, colorName]
    );
  };

  const handleApply = () => {
    onApply(selectedColors);
    onClose();
  };

  const handleTouchStart = (e) => {
    if (!isMobile()) return;
    startYRef.current = e.touches[0].clientY;
    setDragY(0);
  };
  const handleTouchMove = (e) => {
    if (!isMobile()) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };
  const handleTouchEnd = () => {
    if (!isMobile()) return;
    const closeThreshold = window.innerHeight * 0.08;
    if (dragY >= closeThreshold) {
      onClose();
      setDragY(0);
    } else {
      setDragY(0);
    }
  };

  useEffect(() => {
    if (!isMobile() || !isOpen || !handleRef.current) return;
    const el = handleRef.current;
    const onMove = (e) => {
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="color-filter__content">
      <div className="color-filter__header">
        <h3 className="color-filter__title">{i18n.t('filters.color')}</h3>
        <button type="button" className="color-filter__close" onClick={onClose} aria-label="Yopish">
          <i className="bx bx-x" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="color-filter__empty">Ushbu tanlovda ranglar topilmadi.</p>
      ) : (
        <ul className="color-filter__list">
          {options.map((colorName) => {
            const checked = selectedColors.includes(colorName);
            return (
              <li key={colorName} className="color-filter__item">
                <label className="color-filter__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(colorName)}
                    className="color-filter__check"
                  />
                  <span className="color-filter__checkmark" />
                  <span className="color-filter__name">{colorName || 'Rangsiz'}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={`color-filter__apply ${hasSelection ? 'color-filter__apply--active' : ''}`}
        onClick={handleApply}
      >
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="color-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`color-filter__modal ${isMobile() ? 'color-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="color-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="color-filter__body">{content}</div>
      </div>
    </>
  );
};

export default ColorFilter;
