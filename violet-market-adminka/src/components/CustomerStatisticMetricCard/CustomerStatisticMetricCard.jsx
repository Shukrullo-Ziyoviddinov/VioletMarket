import React, { useId } from 'react';
import './CustomerStatisticMetricCard.css';

function CustomerTrendChart({ gradientId, tone = 'positive' }) {
  const palettes = {
    positive: {
      stroke: '#16a34a',
      fill: '#86efac',
      areaPath:
        'M0 36 C10 35 18 28 28 30 C38 32 48 22 58 24 C68 26 78 16 88 18 C98 20 108 12 120 10 L120 48 L0 48 Z',
      linePath:
        'M0 36 C10 35 18 28 28 30 C38 32 48 22 58 24 C68 26 78 16 88 18 C98 20 108 12 120 10',
      dotY: 10,
    },
    negative: {
      stroke: '#dc2626',
      fill: '#fca5a5',
      areaPath:
        'M0 12 C10 14 18 18 28 20 C38 22 48 24 58 26 C68 28 78 30 88 32 C98 34 108 35 120 37 L120 48 L0 48 Z',
      linePath:
        'M0 12 C10 14 18 18 28 20 C38 22 48 24 58 26 C68 28 78 30 88 32 C98 34 108 35 120 37',
      dotY: 37,
    },
    neutral: {
      stroke: '#6b7280',
      fill: '#d1d5db',
      areaPath:
        'M0 24 C12 24 24 23 36 24 C48 25 60 24 72 24 C84 24 96 23 108 24 C114 24 118 24 120 24 L120 48 L0 48 Z',
      linePath:
        'M0 24 C12 24 24 23 36 24 C48 25 60 24 72 24 C84 24 96 23 108 24 C114 24 118 24 120 24',
      dotY: 24,
    },
  };
  const palette = palettes[tone] || palettes.positive;

  return (
    <svg viewBox="0 0 120 48" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.fill} stopOpacity="0.42" />
          <stop offset="100%" stopColor={palette.fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={palette.areaPath}
        fill={`url(#${gradientId})`}
      />
      <path
        d={palette.linePath}
        stroke={palette.stroke}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy={palette.dotY} r="3.5" fill={palette.stroke} />
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
            <CustomerTrendChart gradientId={gradientId} tone={footerTone} />
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
