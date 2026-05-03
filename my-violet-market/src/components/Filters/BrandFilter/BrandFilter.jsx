import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoriesBrend } from '../../../data/categories';
import './BrandFilter.css';

const MOBILE_BREAKPOINT = 768;

const BrandFilter = ({ isOpen, onClose, onApply, availableBrands, selectedBrands, setSelectedBrands }) => {
  const { i18n } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const options = categoriesBrend.filter((b) => availableBrands.includes(b.filterValue));
  const hasSelection = selectedBrands.length > 0;

  const toggle = (filterValue) => {
    setSelectedBrands((prev) =>
      prev.includes(filterValue) ? prev.filter((v) => v !== filterValue) : [...prev, filterValue]
    );
  };

  const handleApply = () => {
    onApply(selectedBrands);
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
    <div className="brand-filter__content">
      <div className="brand-filter__header">
        <h3 className="brand-filter__title">{i18n.t('filters.brand')}</h3>
        <button type="button" className="brand-filter__close" onClick={onClose} aria-label="Yopish">
          <i className="bx bx-x" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="brand-filter__empty">Ushbu oralikda brendlar topilmadi.</p>
      ) : (
        <ul className="brand-filter__list">
          {options.map((b) => {
            const checked = selectedBrands.includes(b.filterValue);
            return (
              <li key={b.id} className="brand-filter__item">
                <label className="brand-filter__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(b.filterValue)}
                    className="brand-filter__check"
                  />
                  <span className="brand-filter__checkmark" />
                  <span className="brand-filter__name">{b.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={`brand-filter__apply ${hasSelection ? 'brand-filter__apply--active' : ''}`}
        onClick={handleApply}
      >
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="brand-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`brand-filter__modal ${isMobile() ? 'brand-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="brand-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="brand-filter__body">{content}</div>
      </div>
    </>
  );
};

export default BrandFilter;
