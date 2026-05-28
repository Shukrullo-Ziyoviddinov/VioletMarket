import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const clampPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const toNonNegativeInt = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
};

const resolveTone = (remainingPercent) => {
  if (remainingPercent < 20) return 'danger';
  if (remainingPercent <= 45) return 'warning-mix';
  if (remainingPercent <= 50) return 'warning';
  return 'success';
};

const ProductDetailSalesFooter = ({ meta, remainingQuantity = 0, soldCount = 0 }) => {
  const { i18n } = useTranslation();

  const normalized = useMemo(() => {
    const safeRemaining = toNonNegativeInt(meta?.remainingQuantity ?? remainingQuantity);
    const safeSold = toNonNegativeInt(meta?.soldCount ?? soldCount);
    const total = safeRemaining + safeSold;

    const soldPercent =
      meta?.soldPercent != null
        ? clampPercent(meta.soldPercent)
        : total > 0
          ? clampPercent((safeSold / total) * 100)
          : 0;
    const remainingPercent =
      meta?.remainingPercent != null
        ? clampPercent(meta.remainingPercent)
        : total > 0
          ? clampPercent((safeRemaining / total) * 100)
          : 100;
    const tone = typeof meta?.tone === 'string' ? meta.tone : resolveTone(remainingPercent);

    return {
      soldPercent,
      tone,
    };
  }, [meta, remainingQuantity, soldCount]);

  return (
    <div className={`product-detail-sales-progress product-detail-sales-progress--${normalized.tone}`}>
      <p className="product-detail-sales-progress__label">
        {normalized.soldPercent}% {i18n.t('home.flashSaleSold')}
      </p>
      <div className="product-detail-sales-progress__track" aria-hidden="true">
        <div
          className={`product-detail-sales-progress__fill product-detail-sales-progress__fill--${normalized.tone}`}
          style={{ width: `${normalized.soldPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProductDetailSalesFooter;
