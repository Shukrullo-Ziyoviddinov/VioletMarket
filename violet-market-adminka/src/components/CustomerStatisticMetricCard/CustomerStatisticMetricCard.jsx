import React, { useId } from 'react';
import './CustomerStatisticMetricCard.css';

function CustomerTrendChart({ gradientId }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 36 C10 35 18 28 28 30 C38 32 48 22 58 24 C68 26 78 16 88 18 C98 20 108 12 120 10 L120 48 L0 48 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 36 C10 35 18 28 28 30 C38 32 48 22 58 24 C68 26 78 16 88 18 C98 20 108 12 120 10"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="10" r="3.5" fill="#8b5cf6" />
    </svg>
  );
}

export default function CustomerStatisticMetricCard({
  title,
  value,
  footerLabel,
  footerHighlight,
  footerTone = 'positive',
  showChart = false,
}) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <article className="customer-statistic-metric-card">
      <h3 className="customer-statistic-metric-card__title">{title}</h3>

      <div className="customer-statistic-metric-card__body">
        <p className="customer-statistic-metric-card__value">{value}</p>
        {showChart ? (
          <div className="customer-statistic-metric-card__chart">
            <CustomerTrendChart gradientId={gradientId} />
          </div>
        ) : null}
      </div>

      {footerLabel || footerHighlight ? (
        <p className="customer-statistic-metric-card__footer">
          {footerLabel ? (
            <span className="customer-statistic-metric-card__footer-label">{footerLabel}</span>
          ) : null}
          {footerHighlight ? (
            <span
              className={`customer-statistic-metric-card__footer-highlight customer-statistic-metric-card__footer-highlight--${footerTone}`}
            >
              {footerHighlight}
            </span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
