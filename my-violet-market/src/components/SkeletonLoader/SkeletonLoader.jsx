import React from 'react';
import DragScroll from '../DragScroll';
import '../ImageBanner/ImageBanner.css';
import '../UzWarehouse/UzWarehouse.css';
import './SkeletonLoader.css';
import '../ProductSellerChatModal/ProductSellerChatMessageList/ProductSellerChatMessageList.css';

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
      <div className="uz-warehouse-banner__row">
        <div className="uz-warehouse-banner__link">
          <div className="uz-warehouse-banner__img uz-warehouse-banner__img--skeleton skeleton-pulse" />
        </div>
        <div className="uz-warehouse-banner__link">
          <div className="uz-warehouse-banner__img uz-warehouse-banner__img--skeleton skeleton-pulse" />
        </div>
      </div>
    </section>
  );
}

/** Savat: kargo / tegishli API bloki */
export function SkeletonCartCargoPanel() {
  return (
    <div className="cargo-summary cargo-summary--skeleton" aria-busy="true" aria-label="Kargo ma’lumoti yuklanmoqda">
      <SkeletonPulse className="cargo-summary__title--skeleton" />
      <SkeletonPulse className="cargo-country-section cargo-country-section--skeleton" />
      <SkeletonPulse className="cargo-country-section cargo-country-section--skeleton cargo-country-section--skeleton-short" />
    </div>
  );
}

function CartItemSkeleton() {
  return (
    <div className="cart-item cart-item--skeleton" aria-hidden>
      <SkeletonPulse className="cart-item__img-skeleton" />
      <div className="cart-item-info">
        <SkeletonPulse className="cart-item-title cart-item-title--skeleton" />
        <div className="cart-item-details cart-item-details--skeleton">
          <SkeletonPulse className="cart-item-details__line" />
          <SkeletonPulse className="cart-item-details__line cart-item-details__line--short" />
        </div>
        <SkeletonPulse className="quantity-controls quantity-controls--skeleton" />
        <SkeletonPulse className="cart-item-price cart-item-price--skeleton" />
      </div>
    </div>
  );
}

function CartSummarySkeleton() {
  return (
    <div className="cart-summary cart-summary--skeleton" aria-hidden>
      <div className="cart-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`cart-stat-sk-${i}`} className="stat-item stat-item--skeleton">
            <SkeletonPulse className="stat-item__line stat-item__line--label" />
            <SkeletonPulse className="stat-item__line stat-item__line--value" />
          </div>
        ))}
      </div>
      <SkeletonPulse className="total-price total-price--skeleton" />
    </div>
  );
}

function CartDeliverySectionSkeleton() {
  return (
    <div className="delivery-section delivery-section--skeleton" aria-hidden>
      <div className="delivery-section-header delivery-section-header--skeleton">
        <SkeletonPulse className="delivery-section__title-skeleton" />
        <SkeletonPulse className="delivery-info-btn delivery-info-btn--skeleton" />
      </div>
      <div className="delivery-options">
        <SkeletonPulse className="delivery-option delivery-option--skeleton" />
        <SkeletonPulse className="delivery-option delivery-option--skeleton" />
      </div>
    </div>
  );
}

/** Savat sahifasi: mahsulotlar + yig‘indi + yetkazish + kargo */
export function CartPageSkeleton({ itemCount = 2 }) {
  return (
    <div className="cart-container" aria-busy="true" aria-label="Savat yuklanmoqda">
        <div className="cart-items-section">
          <SkeletonPulse className="seller-profile__section-title seller-profile__section-title--skeleton cart-items-section__title-skeleton" />
          {Array.from({ length: itemCount }).map((_, i) => (
            <CartItemSkeleton key={`cart-item-sk-${i}`} />
          ))}
        </div>
        <div className="cart-summary-section">
          <CartSummarySkeleton />
          <CartDeliverySectionSkeleton />
          <SkeletonCartCargoPanel />
          <div className="cart-actions cart-actions--skeleton" aria-hidden>
            <SkeletonPulse className="checkout-btn checkout-btn--skeleton" />
            <SkeletonPulse className="clear-btn clear-btn--skeleton" />
          </div>
        </div>
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

/** Sotuvchi profili: avatar, nom, statistika */
export function SellerProfileHeaderSkeleton() {
  return (
    <header className="seller-profile__header" aria-busy="true" aria-label="Sotuvchi yuklanmoqda">
      <div className="seller-profile__avatar-wrap">
        <SkeletonPulse className="seller-profile__avatar seller-profile__avatar--skeleton" />
      </div>
      <div className="seller-profile__meta">
        <SkeletonPulse className="seller-profile__name seller-profile__name--skeleton" />
        <DragScroll
          className="seller-profile__stats-scroll"
          direction="horizontal"
          usePointerCapture={false}
          aria-hidden
        >
          <div className="seller-profile__stats-row seller-profile__stats-row--skeleton">
            <SkeletonPulse className="seller-profile__stat-line seller-profile__stat-line--skeleton" />
            <SkeletonPulse className="seller-profile__stat-line seller-profile__stat-line--skeleton seller-profile__stat-line--short" />
            <SkeletonPulse className="seller-profile__stat-line seller-profile__stat-line--skeleton seller-profile__stat-line--short" />
            <SkeletonPulse className="seller-profile__subscribe-btn seller-profile__subscribe-btn--skeleton seller-profile__subscribe-btn--desktop" />
          </div>
        </DragScroll>
      </div>
    </header>
  );
}

/** Sotuvchi haqida: sarlavha + qisqa matn */
export function SellerProfileAboutSkeleton() {
  return (
    <section className="seller-profile__about" aria-busy="true" aria-hidden>
      <SkeletonPulse className="seller-profile__section-title seller-profile__section-title--skeleton" />
      <SkeletonPulse className="seller-profile__description seller-profile__description--skeleton global-more__preview--truncated" />
    </section>
  );
}

/** Mahsulotlar bo‘limi sarlavhasi */
export function SellerProfileProductsTitleSkeleton() {
  return (
    <SkeletonPulse className="seller-profile__section-title seller-profile__section-title--skeleton seller-profile__section-title--products" />
  );
}

export function SellerProfileProductsGridSkeleton({ count = 8 }) {
  return (
    <div className="products-grid" aria-busy="true" aria-label="Mahsulotlar yuklanmoqda">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse
          key={`seller-profile-product-sk-${i}`}
          className="product-card product-card--skeleton"
          aria-hidden
        />
      ))}
    </div>
  );
}

function ProfilePendingReviewItemSkeleton() {
  return (
    <li className="profile-pending-reviews-item profile-pending-reviews-item--skeleton" aria-hidden>
      <div className="profile-pending-reviews-item__row">
        <SkeletonPulse className="profile-pending-reviews-item__img profile-pending-reviews-item__img--skeleton" />
        <div className="profile-pending-reviews-item__info">
          <SkeletonPulse className="profile-pending-reviews-item__title--skeleton" />
          <SkeletonPulse className="profile-pending-reviews-item__date--skeleton" />
        </div>
      </div>
      <SkeletonPulse className="profile-pending-reviews-item__btn profile-pending-reviews-item__btn--skeleton" />
    </li>
  );
}

/** Profil → Sharhlarim: API javobi kutilganda */
export function ProfilePendingReviewsSkeleton({ count = 3 }) {
  return (
    <ul
      className="profile-pending-reviews-list profile-pending-reviews-list--skeleton"
      aria-busy="true"
      aria-label="Sharhlar yuklanmoqda"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProfilePendingReviewItemSkeleton key={`pending-review-sk-${i}`} />
      ))}
    </ul>
  );
}

/** Chat: xabarlar yuklanishi (seller/customer bubble shakllari) */
export function SkeletonChatMessages() {
  return (
    <div
      className="product-seller-chat-message-list product-seller-chat-message-list--skeleton"
      aria-busy="true"
      aria-label="Xabarlar yuklanmoqda"
    >
      <div className="message-chat-message-row message-chat-message-row--start">
        <SkeletonPulse className="product-seller-chat-message-bubble product-seller-chat-message-bubble--seller skeleton-chat-bubble skeleton-chat-bubble--seller-md" />
      </div>
      <div className="message-chat-message-row message-chat-message-row--end">
        <SkeletonPulse className="product-seller-chat-message-bubble product-seller-chat-message-bubble--customer skeleton-chat-bubble skeleton-chat-bubble--customer-sm" />
      </div>
      <div className="message-chat-message-row message-chat-message-row--start">
        <SkeletonPulse className="product-seller-chat-message-bubble skeleton-chat-bubble skeleton-chat-bubble--seller-lg" />
      </div>
      <div className="message-chat-message-row message-chat-message-row--end">
        <SkeletonPulse className="product-seller-chat-product-message product-seller-chat-product-message--customer skeleton-chat-product" />
      </div>
      <div className="message-chat-message-row message-chat-message-row--end">
        <SkeletonPulse className="product-seller-chat-message-bubble product-seller-chat-message-bubble--customer skeleton-chat-bubble skeleton-chat-bubble--customer-md" />
      </div>
    </div>
  );
}

export default SkeletonPulse;
