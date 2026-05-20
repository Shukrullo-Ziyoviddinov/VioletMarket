import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import Scrollable from '../Scrollable';
import { SkeletonPulse } from '../SkeletonLoader';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../utils/utils';
import './CartUrgencyBanner.css';

const BASE_COUNTDOWN_MS = 60 * 60 * 1000; // 60 min
const COUNTDOWN_STEP_MS = 10 * 60 * 1000; // +10 min
const COUNTDOWN_VARIANTS = 6; // 60..110 min
const MIN_VIEWS = 11;
const MAX_VIEWS = 19;
const URGENCY_HINT_KEY = 'cartUrgencyHadItems';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function calculateProgressFromCountdown(countdownLeftMs, totalCountdownMs) {
  const safeTotal = Math.max(1, totalCountdownMs);
  const elapsed = safeTotal - Math.max(0, countdownLeftMs);
  const percent = (elapsed / safeTotal) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function parseTriggerMs(value) {
  const ms = new Date(value || '').getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

function hashString(value) {
  let hash = 0;
  const str = String(value || '');
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getViewsForItem(itemKey, nowMs) {
  const hash = hashString(itemKey);
  const slot = Math.floor(nowMs / 8000);
  const drift = ((slot + hash) % 9) - 4;
  return clamp(15 + drift, MIN_VIEWS, MAX_VIEWS);
}

function getCountdownMsForItem(itemKey) {
  const hash = hashString(itemKey);
  const variant = hash % COUNTDOWN_VARIANTS;
  return BASE_COUNTDOWN_MS + variant * COUNTDOWN_STEP_MS;
}

const CartUrgencyBanner = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { urgencyItems, dismissUrgencyBanner, cartLoading, cartReady } = useCart();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [hadUrgencyHint, setHadUrgencyHint] = useState(() => {
    try {
      return localStorage.getItem(URGENCY_HINT_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleItems = useMemo(() => {
    return (urgencyItems || []).filter((item) => {
      const triggerAt = parseTriggerMs(item?.urgencyNextShowAt);
      const endsAt = parseTriggerMs(item?.urgencyEndsAt);
      return (
        Number.isFinite(triggerAt) &&
        nowMs >= triggerAt &&
        (!Number.isFinite(endsAt) || nowMs < endsAt)
      );
    });
  }, [urgencyItems, nowMs]);

  useEffect(() => {
    const hasUrgencyItems = (urgencyItems?.length || 0) > 0;
    if (hasUrgencyItems) {
      setHadUrgencyHint(true);
      try {
        localStorage.setItem(URGENCY_HINT_KEY, '1');
      } catch {}
      return;
    }
    if (!cartLoading) {
      setHadUrgencyHint(false);
      try {
        localStorage.removeItem(URGENCY_HINT_KEY);
      } catch {}
    }
  }, [urgencyItems, cartLoading]);

  if ((!cartReady && hadUrgencyHint) || (cartLoading && ((urgencyItems?.length || 0) > 0 || hadUrgencyHint))) {
    return (
      <Scrollable type="product" className="cart-urgency-scrollable">
        {Array.from({ length: 2 }).map((_, idx) => (
          <section className="cart-urgency-banner cart-urgency-banner--skeleton" key={`urgency-sk-${idx}`} aria-hidden>
            <div className="cart-urgency-banner__image-wrap">
              <SkeletonPulse className="cart-urgency-banner__image-skeleton" />
            </div>

            <div className="cart-urgency-banner__content">
              <SkeletonPulse className="cart-urgency-banner__title-skeleton" />

              <div className="cart-urgency-banner__stats">
                <div>
                  <div className="cart-urgency-banner__price-row">
                    <SkeletonPulse className="cart-urgency-banner__price-main-skeleton" />
                    <SkeletonPulse className="cart-urgency-banner__price-old-skeleton" />
                  </div>
                </div>
                <div>
                  <SkeletonPulse className="cart-urgency-banner__timer-skeleton" />
                </div>
              </div>

              <div className="cart-urgency-banner__progress-head">
                <SkeletonPulse className="cart-urgency-banner__progress-label-skeleton" />
                <SkeletonPulse className="cart-urgency-banner__progress-percent-skeleton" />
              </div>
              <SkeletonPulse className="cart-urgency-banner__progress-track-skeleton" />

              <div className="cart-urgency-banner__badges">
                <SkeletonPulse className="cart-urgency-banner__badge-skeleton" />
                <SkeletonPulse className="cart-urgency-banner__badge-skeleton" />
                <SkeletonPulse className="cart-urgency-banner__cta-skeleton" />
              </div>
            </div>
          </section>
        ))}
      </Scrollable>
    );
  }

  if (visibleItems.length === 0) return null;

  return (
    <Scrollable type="product" className="cart-urgency-scrollable">
      {visibleItems.map((item) => {
        const triggerAt = parseTriggerMs(item.urgencyNextShowAt);
        const endsAt = parseTriggerMs(item.urgencyEndsAt);
        const itemKey = item?.cartItemId || item?.id;
        const itemCountdownMs = Number.isFinite(item?.urgencyDurationMs)
          ? Number(item.urgencyDurationMs)
          : getCountdownMsForItem(itemKey);
        const countdownEndMs = Number.isFinite(endsAt) ? endsAt : (triggerAt + itemCountdownMs);
        const countdownLeftMs = Math.max(0, countdownEndMs - nowMs);
        const progressPercent = calculateProgressFromCountdown(countdownLeftMs, itemCountdownMs);
        const currentPrice = Number(item?.price ?? 0);
        const oldPrice = Number(item?.originalPrice ?? currentPrice);
        const imageSrc = normalizeImagePath(item?.image);
        const stockLeft = Math.max(1, Number(item?.urgencyStockLeft) || 1);
        const views = getViewsForItem(itemKey, nowMs);
        const rawTitle = item?.title;
        const title = !rawTitle
          ? t('cartUrgency.defaultProductName', { defaultValue: 'Mahsulot' })
          : typeof rawTitle === 'object'
            ? getLocalizedText(rawTitle, i18n.language || 'uz')
            : String(rawTitle);

        return (
          <section className="cart-urgency-banner" role="status" aria-live="polite" key={itemKey}>
            <button
              type="button"
              className="cart-urgency-banner__close"
              onClick={() => dismissUrgencyBanner(item)}
              aria-label={t('cartUrgency.close', { defaultValue: 'Yopish' })}
            >
              <i className="bx bx-x" />
            </button>

            <div className="cart-urgency-banner__image-wrap">
              <img src={imageSrc} alt={title} className="cart-urgency-banner__image" />
            </div>

            <div className="cart-urgency-banner__content">
              <h3 className="cart-urgency-banner__title">
                {t('cartUrgency.title', {
                  defaultValue: 'Siz tanlagan mahsulotga talab oshmoqda',
                })}
              </h3>

              <div className="cart-urgency-banner__stats">
                <div>
                  <div className="cart-urgency-banner__label">
                    {t('cartUrgency.priceLabel', { defaultValue: 'Price' })}
                  </div>
                  <div className="cart-urgency-banner__price-row">
                    <strong>{formatPrice(currentPrice)}</strong>
                    {oldPrice > currentPrice && <span>{formatPrice(oldPrice)}</span>}
                  </div>
                </div>

                <div>
                  <div className="cart-urgency-banner__label">
                    {t('cartUrgency.countdownLabel', { defaultValue: 'Countdown timer' })}
                  </div>
                  <div className="cart-urgency-banner__timer">{formatDuration(countdownLeftMs)}</div>
                </div>
              </div>

              <div className="cart-urgency-banner__progress-head">
                <span>{t('cartUrgency.loadingProgress', { defaultValue: 'Loading progress' })}</span>
                <strong>{progressPercent}%</strong>
              </div>
              <div className="cart-urgency-banner__progress-track">
                <span
                  className="cart-urgency-banner__progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="cart-urgency-banner__badges">
                <span className="cart-urgency-banner__badge cart-urgency-banner__badge--views">
                  <i className="bx bxs-user" />
                  {t('cartUrgency.viewsNow', {
                    defaultValue: 'Hozir {{count}} kishi ko‘rmoqda',
                    count: views,
                  })}
                </span>
                <span className="cart-urgency-banner__badge cart-urgency-banner__badge--stock">
                  <i className="bx bxs-circle" />
                  {t('cartUrgency.stockLeft', {
                    defaultValue: 'Oxirgi {{count}} dona',
                    count: stockLeft,
                  })}
                </span>
                <button
                  type="button"
                  className="cart-urgency-banner__cta"
                  onClick={() => navigate('/checkout')}
                >
                  {t('cartUrgency.cta', { defaultValue: 'Hozir buyurtma berish' })}
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </Scrollable>
  );
};

export default CartUrgencyBanner;
