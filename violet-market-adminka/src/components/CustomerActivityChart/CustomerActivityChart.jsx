import React, { useMemo, useState } from 'react';
import { Select } from 'antd';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CUSTOMER_ACTIVITY_FILTER_OPTIONS,
  CUSTOMER_ACTIVITY_SERIES,
} from './customerActivityMock';
import './CustomerActivityChart.css';

function formatYAxisTick(value) {
  return Number(value).toLocaleString('en-US');
}

function formatDeltaText(current, previous) {
  if (previous == null) return 'Birinchi nuqta';
  const delta = current - previous;
  if (delta === 0) return "O'zgarish yo'q";

  const percent = previous > 0
    ? Math.round((delta / previous) * 1000) / 10
    : 100;

  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} (${sign}${percent}%)`;
}

function buildYAxisConfig(data, seriesKeys) {
  let maxValue = 0;
  let minValue = Number.POSITIVE_INFINITY;

  (Array.isArray(data) ? data : []).forEach((point) => {
    seriesKeys.forEach((key) => {
      const value = Number(point?.[key]) || 0;
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
    });
  });

  if (!Number.isFinite(minValue)) {
    minValue = 0;
  }

  if (maxValue <= 0) {
    return {
      domain: [0, 4],
      ticks: [0, 1, 2, 3, 4],
    };
  }

  if (maxValue <= 8) {
    const top = Math.max(maxValue + 1, 4);
    return {
      domain: [0, top],
      ticks: Array.from({ length: top + 1 }, (_, index) => index),
    };
  }

  const top = Math.max(maxValue + Math.ceil(maxValue * 0.15), maxValue + 2);
  let step = 1;

  if (top > 12) step = 2;
  if (top > 24) step = 4;
  if (top > 50) step = 5;
  if (top > 100) step = 10;
  if (top > 200) step = 20;
  if (top > 500) step = 50;
  if (top > 1000) step = 100;

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

function CustomerActivityTooltip({ active, payload, label, data }) {
  if (!active || !payload?.length) return null;

  const pointIndex = data.findIndex((item) => item.label === label);
  const previousPoint = pointIndex > 0 ? data[pointIndex - 1] : null;

  return (
    <div className="customer-activity-chart__tooltip">
      <p className="customer-activity-chart__tooltip-title">{label}</p>
      {payload.map((entry) => {
        const key = entry.dataKey;
        const value = Number(entry.value) || 0;
        const previousValue = previousPoint ? Number(previousPoint[key]) || 0 : null;
        const deltaText = formatDeltaText(value, previousValue);
        const isPositive = previousValue != null && value > previousValue;
        const isNegative = previousValue != null && value < previousValue;

        return (
          <div key={key} className="customer-activity-chart__tooltip-row">
            <span
              className="customer-activity-chart__tooltip-dot"
              style={{ backgroundColor: entry.color }}
            />
            <span className="customer-activity-chart__tooltip-name">{entry.name}</span>
            <span className="customer-activity-chart__tooltip-value">{formatYAxisTick(value)}</span>
            <span
              className={`customer-activity-chart__tooltip-delta${
                isPositive
                  ? ' customer-activity-chart__tooltip-delta--positive'
                  : isNegative
                    ? ' customer-activity-chart__tooltip-delta--negative'
                    : ''
              }`}
            >
              {deltaText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CustomerActivityLegend({ series, activeFilter }) {
  const visibleSeries = activeFilter === 'all'
    ? series
    : series.filter((item) => item.key === activeFilter);

  return (
    <div className="customer-activity-chart__legend">
      {visibleSeries.map((item) => (
        <div key={item.key} className="customer-activity-chart__legend-item">
          <span
            className="customer-activity-chart__legend-swatch"
            style={{ backgroundColor: item.legendColor }}
          />
          <span className="customer-activity-chart__legend-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CustomerActivityChart({
  title = "Ro'yxatdan o'tgan mijozlar faolligi",
  chartId = 'registered',
  data = [],
  filterOptions = CUSTOMER_ACTIVITY_FILTER_OPTIONS,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const visibleSeries = useMemo(() => {
    if (activeFilter === 'all') {
      return CUSTOMER_ACTIVITY_SERIES;
    }

    return CUSTOMER_ACTIVITY_SERIES.filter((item) => item.key === activeFilter);
  }, [activeFilter]);

  const yAxisConfig = useMemo(
    () => buildYAxisConfig(data, visibleSeries.map((item) => item.key)),
    [data, visibleSeries],
  );

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <section className="customer-activity-chart">
      <div className="customer-activity-chart__header">
        <h2 className="customer-activity-chart__title">{title}</h2>

        <Select
          className="customer-activity-chart__filter"
          value={activeFilter}
          options={filterOptions}
          onChange={setActiveFilter}
        />
      </div>

      <CustomerActivityLegend series={CUSTOMER_ACTIVITY_SERIES} activeFilter={activeFilter} />

      <div className="customer-activity-chart__canvas">
        {!hasData ? (
          <div className="customer-activity-chart__empty">Tanlangan oy uchun grafik ma&apos;lumoti hali yo&apos;q</div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 0 }}>
              <defs>
                {CUSTOMER_ACTIVITY_SERIES.map((item) => (
                  <linearGradient
                    key={item.key}
                    id={`customer-activity-gradient-${chartId}-${item.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={item.fill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={item.fill} stopOpacity={0.04} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid
                stroke="#ece7f3"
                strokeDasharray="0"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={18}
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
                width={44}
              />

              <Tooltip
                cursor={{ stroke: '#d8cfe8', strokeWidth: 1 }}
                content={<CustomerActivityTooltip data={data} />}
              />

              {visibleSeries.map((item) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.stroke}
                  strokeWidth={3}
                  fill={`url(#customer-activity-gradient-${chartId}-${item.key})`}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: item.stroke,
                    stroke: '#ffffff',
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: item.stroke,
                    stroke: '#ffffff',
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
