import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './PriceFilter.css';

const MOBILE_BREAKPOINT = 768;

const PriceFilter = ({ isOpen, onClose, onApply, products, priceRange: appliedRange, getProductPriceNumber }) => {
  const { i18n } = useTranslation();
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [noProductsInRange, setNoProductsInRange] = useState(false);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const prices = products
    .map((p) => getProductPriceNumber(p))
    .filter((n) => n != null && !isNaN(n));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  useEffect(() => {
    if (isOpen) {
      setNoProductsInRange(false);
      if (appliedRange) {
        setMinInput(String(appliedRange.min));
        setMaxInput(String(appliedRange.max));
      } else {
        setMinInput(minPrice ? String(Math.floor(minPrice)) : '');
        setMaxInput(maxPrice ? String(Math.ceil(maxPrice)) : '');
      }
    }
  }, [isOpen, appliedRange, minPrice, maxPrice]);

  const handleApply = () => {
    const min = minInput ? parseFloat(String(minInput).replace(/\s/g, '')) : null;
    const max = maxInput ? parseFloat(String(maxInput).replace(/\s/g, '')) : null;
    if (min == null && max == null) {
      onApply(null);
      onClose();
      return;
    }
    const actualMin = min != null ? min : minPrice;
    const actualMax = max != null ? max : maxPrice;
    if (actualMin > actualMax) {
      setNoProductsInRange(true);
      return;
    }
    const inRange = products.filter((p) => {
      const num = getProductPriceNumber(p);
      if (num == null) return false;
      return num >= actualMin && num <= actualMax;
    });
    if (inRange.length === 0) {
      setNoProductsInRange(true);
      return;
    }
    setNoProductsInRange(false);
    onApply({ min: actualMin, max: actualMax });
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
    <div className="price-filter__content">
      <div className="price-filter__header">
        <h3 className="price-filter__title">{i18n.t('filters.priceRangeTitle')}</h3>
        <button
          type="button"
          className="price-filter__close"
          onClick={onClose}
          aria-label="Yopish"
        >
          <i className="bx bx-x" />
        </button>
      </div>
      <div className="price-filter__inputs">
        <input
          type="number"
          className="price-filter__input"
          placeholder="Min"
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          min={0}
        />
        <span className="price-filter__separator">—</span>
        <input
          type="number"
          className="price-filter__input"
          placeholder="Max"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          min={0}
        />
      </div>
      {noProductsInRange && (
        <p className="price-filter__empty-msg">Bu narxda mahsulot yo&apos;q. Boshqa oralikni kiriting.</p>
      )}
      <button type="button" className="price-filter__apply" onClick={handleApply}>
        {i18n.t('filters.apply')}
      </button>
    </div>
  );

  return (
    <>
      <div className="price-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`price-filter__modal ${isMobile() ? 'price-filter__modal--bottom' : ''}`}
        style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {isMobile() && (
          <div
            ref={handleRef}
            className="price-filter__drag-handle"
            role="button"
            tabIndex={0}
            aria-label="Pastga suring yopish uchun"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        )}
        <div className="price-filter__body">{content}</div>
      </div>
    </>
  );
};

export default PriceFilter;
