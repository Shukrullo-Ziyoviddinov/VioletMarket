import React, { useId } from 'react';
import './SalesStatisticsMetricCard.css';

function SalesInlineGrowthChart({ tone = 'neutral' }) {
  const palettes = {
    positive: {
      stroke: '#16a34a',
      path: 'M1 13 L6 9 L11 11 L17 5 L23 7',
    },
    negative: {
      stroke: '#dc2626',
      path: 'M1 5 L6 8 L11 7 L17 12 L23 10',
    },
    neutral: {
      stroke: '#2563eb',
      path: 'M1 9 L23 9',
    },
  };
  const palette = palettes[tone] || palettes.neutral;

  return (
    <svg
      className="sales-statistics-metric-card__inline-growth-chart"
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={palette.path}
        stroke={palette.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SalesTrendChart({ gradientId, tone = 'positive' }) {
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
      stroke: '#2563eb',
      fill: '#93c5fd',
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
      <path d={palette.areaPath} fill={`url(#${gradientId})`} />
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

export default function SalesStatisticsMetricCard({
  title,
  value,
  growthFormatted = '0%',
  tone = 'neutral',
  loading = false,
}) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <article className="sales-statistics-metric-card">
      <div className="sales-statistics-metric-card__header">
        <h3 className="sales-statistics-metric-card__title">{title}</h3>
        <span className={`sales-statistics-metric-card__badge sales-statistics-metric-card__badge--${tone}`}>
          {loading ? '...' : growthFormatted}
        </span>
      </div>

      <div className="sales-statistics-metric-card__body">
        <div className="sales-statistics-metric-card__value-row">
          <p className="sales-statistics-metric-card__value">{loading ? '...' : value}</p>
          {!loading ? (
            <span
              className={`sales-statistics-metric-card__inline-growth sales-statistics-metric-card__inline-growth--${tone}`}
            >
              <span className="sales-statistics-metric-card__inline-growth-percent">
                {growthFormatted}
              </span>
              <SalesInlineGrowthChart tone={tone} />
            </span>
          ) : null}
        </div>
        <div className="sales-statistics-metric-card__chart">
          <SalesTrendChart gradientId={gradientId} tone={tone} />
        </div>
      </div>
    </article>
  );
}
