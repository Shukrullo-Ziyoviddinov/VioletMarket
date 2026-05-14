import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../../contexts/AppDataContext';
import { getLocalizedText } from '../../../utils/utils';
import './CountryFilter.css';

const MOBILE_BREAKPOINT = 768;

const CountryFilter = ({ isOpen, onClose, onApply, availableCountries, selectedCountries, setSelectedCountries }) => {
  const { i18n } = useTranslation();
  const { categoriyCountries } = useAppData();
  const lang = i18n.language || 'uz';
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const options = (categoriyCountries || []).filter((c) => availableCountries.includes(c.filterValue));
  const hasSelection = selectedCountries.length > 0;

  const toggle = (filterValue) => {
    setSelectedCountries((prev) =>
      prev.includes(filterValue) ? prev.filter((v) => v !== filterValue) : [...prev, filterValue]
    );
  };

  const handleApply = () => {
    onApply(selectedCountries);
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
    <div className="country-filter__content">
      <div className="country-filter__header">
        <h3 className="country-filter__title">{i18n.t('filters.country')}</h3>
        <button type="button" className="country-filter__close" onClick={onClose} aria-label="Yopish">
          <i className="bx bx-x" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="country-filter__empty">Ushbu tanlovda davlatlar topilmadi.</p>
      ) : (
        <ul className="country-filter__list">
          {options.map((c) => {
            const checked = selectedCountries.includes(c.filterValue);
            return (
              <li key={c.id} className="country-filter__item">
                <label className="country-filter__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.filterValue)}
                    className="country-filter__check"
                  />
                  <span className="country-filter__checkmark" />
                  <span className="country-filter__name">{getLocalizedText(c.name, lang)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={`country-filter__apply ${hasSelection ? 'country-filter__apply--active' : ''}`}
        onClick={handleApply}
      >
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="country-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`country-filter__modal ${isMobile() ? 'country-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="country-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="country-filter__body">{content}</div>
      </div>
    </>
  );
};

export default CountryFilter;
