import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './GenreFilter.css';

const MOBILE_BREAKPOINT = 768;

const GenreFilter = ({ isOpen, onClose, onApply, availableGenres, selectedGenres, setSelectedGenres }) => {
  const { i18n } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const options = [...(availableGenres || [])].sort();
  const hasSelection = selectedGenres.length > 0;

  const getLabel = (value) => {
    const key = `filters.genre.${value}`;
    const t = i18n.t(key);
    return t !== key ? t : value;
  };

  const toggle = (value) => {
    setSelectedGenres((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleApply = () => {
    onApply(selectedGenres);
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
    <div className="genre-filter__content">
      <div className="genre-filter__header">
        <h3 className="genre-filter__title">{i18n.t('filters.bookGenre')}</h3>
        <button type="button" className="genre-filter__close" onClick={onClose} aria-label="Yopish">
          <i className="bx bx-x" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="genre-filter__empty">{i18n.t('filters.noGenres')}</p>
      ) : (
        <ul className="genre-filter__list">
          {options.map((value) => {
            const checked = selectedGenres.includes(value);
            return (
              <li key={value} className="genre-filter__item">
                <label className="genre-filter__label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(value)}
                    className="genre-filter__check"
                  />
                  <span className="genre-filter__checkmark" />
                  <span className="genre-filter__name">{getLabel(value)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={`genre-filter__apply ${hasSelection ? 'genre-filter__apply--active' : ''}`}
        onClick={handleApply}
      >
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="genre-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`genre-filter__modal ${isMobile() ? 'genre-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="genre-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="genre-filter__body">{content}</div>
      </div>
    </>
  );
};

export default GenreFilter;
