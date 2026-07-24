import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './ReturnedProductsGrowthChart.css';

const CHART_PALETTES = {
  positive: { stroke: '#16a34a', fill: '#86efac' },
  negative: { stroke: '#dc2626', fill: '#fca5a5' },
  neutral: { stroke: '#7b49c8', fill: '#d8b4fe' },
};

function resolvePalette(points) {
  if (!Array.isArray(points) || points.length < 2) return CHART_PALETTES.neutral;
  const last = points[points.length - 1];
  if (last?.tone === 'positive') return CHART_PALETTES.positive;
  if (last?.tone === 'negative') return CHART_PALETTES.negative;
  return CHART_PALETTES.neutral;
}

function formatGrowth(value) {
  const num = Number(value) || 0;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

export default function ReturnedProductsGrowthChart({ chart, loading = false }) {
  const points = Array.isArray(chart?.points) ? chart.points : [];
  const palette = useMemo(() => resolvePalette(points), [points]);
  const last = points[points.length - 1] || null;

  return (
    <section className="returned-products-growth-chart">
      <header className="returned-products-growth-chart__header">
        <div>
          <h2 className="returned-products-growth-chart__title">Qaytarish Statistikasi</h2>
          <p className="returned-products-growth-chart__subtitle">
            Kun / hafta / oy bo‘yicha o‘sish va kamayish
          </p>
        </div>
        {last ? (
          <div
            className={`returned-products-growth-chart__growth returned-products-growth-chart__growth--${
              last.tone || 'neutral'
            }`}
          >
            {formatGrowth(last.growthPercent)}
          </div>
        ) : null}
      </header>

      <div className="returned-products-growth-chart__body">
        {loading ? (
          <p className="returned-products-growth-chart__empty">Yuklanmoqda...</p>
        ) : points.length === 0 ? (
          <p className="returned-products-growth-chart__empty">Grafik uchun ma’lumot yo‘q</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee9f3" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value) => [`${value} ta`, 'Soni']}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={palette.stroke}
                fill={palette.fill}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
