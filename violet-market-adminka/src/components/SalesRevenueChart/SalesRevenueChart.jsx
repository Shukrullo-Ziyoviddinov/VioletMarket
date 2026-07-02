import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatRevenue } from '../../utils/productDisplay';
import './SalesRevenueChart.css';

const GRANULARITY_OPTIONS = [
  { key: 'day', label: 'Kun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
];

const CHART_PALETTES = {
  positive: {
    stroke: '#16a34a',
    fill: '#86efac',
    dot: '#16a34a',
  },
  negative: {
    stroke: '#dc2626',
    fill: '#fca5a5',
    dot: '#dc2626',
  },
  neutral: {
    stroke: '#2563eb',
    fill: '#93c5fd',
    dot: '#2563eb',
  },
};

function formatYAxisTick(value) {
  return new Intl.NumberFormat('uz-UZ').format(Number(value) || 0);
}

function formatPointLabel(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return '';
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

function buildYAxisConfig(data) {
  let maxValue = 0;
  (Array.isArray(data) ? data : []).forEach((point) => {
    maxValue = Math.max(maxValue, Number(point?.revenue) || 0);
  });

  if (maxValue <= 0) {
    return { domain: [0, 4], ticks: [0, 1, 2, 3, 4] };
  }

  const top = Math.ceil(maxValue * 1.15);
  let step = 1;
  if (top > 10) step = 2;
  if (top > 50) step = 5;
  if (top > 100) step = 10;
  if (top > 500) step = 50;
  if (top > 1000) step = 100;
  if (top > 5000) step = 500;
  if (top > 10000) step = 1000;
  if (top > 100000) step = 10000;
  if (top > 1000000) step = 100000;
  if (top > 10000000) step = 1000000;

  const ticks = [];
  for (let tick = 0; tick <= top; tick += step) {
    ticks.push(tick);
  }
  if (ticks[ticks.length - 1] < top) {
    ticks.push(top);
  }

  return {
    domain: [0, ticks[ticks.length - 1]],
    ticks,
  };
}

function SalesRevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const revenue = Number(point.revenue) || 0;
  const previousRevenue = point.previousRevenue;
  let deltaText = '';
  let deltaTone = 'neutral';

  if (previousRevenue != null) {
    const delta = revenue - previousRevenue;
    if (delta === 0) {
      deltaText = "O'zgarish yo'q";
    } else {
      const percent = previousRevenue > 0
        ? Math.round((delta / previousRevenue) * 1000) / 10
        : 100;
      const sign = delta > 0 ? '+' : '';
      deltaText = `${sign}${new Intl.NumberFormat('uz-UZ').format(delta)} UZS (${sign}${percent}%)`;
      deltaTone = delta > 0 ? 'positive' : 'negative';
    }
  }

  return (
    <div className="sales-revenue-chart__tooltip">
      <p className="sales-revenue-chart__tooltip-title">{point.tooltipLabel || point.label}</p>
      <div className="sales-revenue-chart__tooltip-row">
        <span className="sales-revenue-chart__tooltip-dot" />
        <span className="sales-revenue-chart__tooltip-name">Daromat</span>
        <span className="sales-revenue-chart__tooltip-value">{formatRevenue(revenue)}</span>
      </div>
      {deltaText ? (
        <p className={`sales-revenue-chart__tooltip-delta sales-revenue-chart__tooltip-delta--${deltaTone}`}>
          {deltaText}
        </p>
      ) : null}
    </div>
  );
}

export default function SalesRevenueChart({
  granularity = 'day',
  onGranularityChange,
  points = [],
  overallTone = 'neutral',
  loading = false,
}) {
  const palette = CHART_PALETTES[overallTone] || CHART_PALETTES.neutral;
  const chartData = useMemo(
    () => (Array.isArray(points) ? points : []),
    [points],
  );
  const yAxisConfig = useMemo(() => buildYAxisConfig(chartData), [chartData]);
  const hasData = chartData.length > 0;

  return (
    <section className="sales-revenue-chart">
      <div className="sales-revenue-chart__header">
        <div className="sales-revenue-chart__filters">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`sales-revenue-chart__filter-btn${
                granularity === option.key ? ' sales-revenue-chart__filter-btn--active' : ''
              }`}
              onClick={() => {
                if (typeof onGranularityChange === 'function') {
                  onGranularityChange(option.key);
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <h2 className="sales-revenue-chart__title">Daromat statistikasi</h2>
      </div>

      <div className="sales-revenue-chart__canvas">
        {loading ? (
          <div className="sales-revenue-chart__empty">Yuklanmoqda...</div>
        ) : !hasData ? (
          <div className="sales-revenue-chart__empty">
            Tanlangan davr uchun grafik ma&apos;lumoti hali yo&apos;q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="sales-revenue-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.fill} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={palette.fill} stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
                tick={{ fill: '#6b5b7d', fontSize: 11, fontWeight: 500 }}
                dy={8}
              />

              <YAxis
                domain={yAxisConfig.domain}
                ticks={yAxisConfig.ticks}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b5b7d', fontSize: 12, fontWeight: 600 }}
                tickFormatter={formatYAxisTick}
                width={72}
              />

              <Tooltip
                cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
                content={<SalesRevenueTooltip />}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                name="Daromat"
                stroke={palette.stroke}
                strokeWidth={3}
                fill="url(#sales-revenue-chart-gradient)"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: palette.dot,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  fill: palette.dot,
                  stroke: '#ffffff',
                }}
              >
                <LabelList
                  dataKey="revenue"
                  position="top"
                  formatter={formatPointLabel}
                  className="sales-revenue-chart__point-label"
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
