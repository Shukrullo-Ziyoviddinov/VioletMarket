import React from 'react';
import '../ImageBanner/ImageBanner.css';
import '../UzWarehouse/UzWarehouse.css';
import './SkeletonLoader.css';

/** Asosiy pulse blok (className bilan kengaytirish mumkin) */
export function SkeletonPulse({ className = '', style, ...rest }) {
  return <div className={`skeleton-pulse ${className}`.trim()} style={style} {...rest} />;
}

/**
 * Bosh sahifa banner: .manga-image.left | .center | .right
 * API `loading` bo‘lganda ImageBanner o‘rniga.
 */
export function SkeletonMangaBanner() {
  return (
    <div className="containers skeleton-manga-root" aria-busy="true" aria-label="Banner yuklanmoqda">
      <div className="manga-carousel manga-carousel--skeleton">
        <ul className="manga-slides">
          <li className="manga-image left">
            <SkeletonPulse className="skeleton-pulse--fill" />
          </li>
          <li className="manga-image center">
            <SkeletonPulse className="skeleton-pulse--fill" />
          </li>
          <li className="manga-image right">
            <SkeletonPulse className="skeleton-pulse--fill" />
          </li>
        </ul>
      </div>
    </div>
  );
}

/** .uz-warehouse-banner__img — API yuklanishi */
export function SkeletonUzWarehouseBanner() {
  return (
    <section
      className="uz-warehouse-banner container uz-warehouse-banner--skeleton"
      aria-busy="true"
      aria-label="Banner yuklanmoqda"
    >
      <div className="uz-warehouse-banner__img uz-warehouse-banner__img--skeleton skeleton-pulse" />
    </section>
  );
}

/** Savat: kargo / tegishli API bloki */
export function SkeletonCartCargoPanel() {
  return (
    <div className="skeleton-cart-cargo" aria-busy="true" aria-label="Kargo ma’lumoti yuklanmoqda">
      <SkeletonPulse className="skeleton-cart-cargo__row" />
      <SkeletonPulse className="skeleton-cart-cargo__row skeleton-cart-cargo__row--short" />
      <SkeletonPulse className="skeleton-cart-cargo__row skeleton-cart-cargo__row--medium" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 10, className = '' }) {
  return (
    <div
      className={`skeleton-product-grid skeleton-product-grid--span ${className}`.trim()}
      aria-busy="true"
      aria-label="Mahsulotlar yuklanmoqda"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse key={i} className="skeleton-product-grid__cell" />
      ))}
    </div>
  );
}

export default SkeletonPulse;
