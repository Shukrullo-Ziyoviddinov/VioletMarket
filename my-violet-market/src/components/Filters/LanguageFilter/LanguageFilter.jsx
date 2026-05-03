import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageFilter.css';

const MOBILE_BREAKPOINT = 768;

const LanguageFilter = ({ isOpen, onClose, onApply, availableLanguages, selectedLanguages, setSelectedLanguages }) => {
  const { i18n } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const options = [...(availableLanguages || [])].sort();
  const hasSelection = selectedLanguages.length > 0;

  const getLabel = (value) => {
    const key = `filters.language.${value}`;
    const t = i18n.t(key);
    return t !== key ? t : value;
  };

  const toggle = (value) => {
    setSelectedLanguages((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleApply = () => {
    onApply(selectedLanguages);
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
    <div className="language-filter__content">
      <div className="language-filter__header">
        <h3 className="language-filter__title">{i18n.t('filters.bookLanguage')}</h3>
        <button type="button" className="language-filter__close" onClick={onClose} aria-label="Yopish">
          <i className="bx bx-x" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="language-filter__empty">{i18n.t('filters.noLanguages')}</p>
      ) : (
        <ul className="language-filter__list">
          {options.map((value) => {
            const checked = selectedLanguages.includes(value);
            return (
              <li key={value} className="language-filter__item">
                <label className="language-filter__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(value)}
                    className="language-filter__check"
                  />
                  <span className="language-filter__checkmark" />
                  <span className="language-filter__name">{getLabel(value)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={`language-filter__apply ${hasSelection ? 'language-filter__apply--active' : ''}`}
        onClick={handleApply}
      >
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="language-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`language-filter__modal ${isMobile() ? 'language-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="language-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="language-filter__body">{content}</div>
      </div>
    </>
  );
};

export default LanguageFilter;
