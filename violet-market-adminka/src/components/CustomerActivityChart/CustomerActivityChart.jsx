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
  return value.toLocaleString('en-US');
}

function buildYAxisConfig(data, seriesKeys) {
  let maxValue = 0;

  (Array.isArray(data) ? data : []).forEach((point) => {
    seriesKeys.forEach((key) => {
      maxValue = Math.max(maxValue, Number(point?.[key]) || 0);
    });
  });

  if (maxValue <= 0) {
    return {
      domain: [0, 5],
      ticks: [0, 1, 2, 3, 4, 5],
    };
  }

  const top = Math.max(5, Math.ceil(maxValue * 1.2));
  let step = 1;

  if (top > 10) step = 2;
  if (top > 20) step = 5;
  if (top > 50) step = 10;
  if (top > 100) step = 20;
  if (top > 200) step = 50;
  if (top > 500) step = 100;
  if (top > 1000) step = 200;
  if (top > 5000) step = 1000;
  if (top > 10000) step = 2000;

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
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
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
                  <stop offset="0%" stopColor={item.fill} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={item.fill} stopOpacity={0} />
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
              tick={{ fill: '#6b5b7d', fontSize: 12, fontWeight: 500 }}
              dy={8}
            />

            <YAxis
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b5b7d', fontSize: 12, fontWeight: 500 }}
              tickFormatter={formatYAxisTick}
              width={52}
            />

            <Tooltip
              cursor={{ stroke: '#d8cfe8', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #ece7f3',
                boxShadow: '0 8px 24px rgba(42, 24, 66, 0.08)',
              }}
              formatter={(value) => formatYAxisTick(value)}
            />

            {visibleSeries.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.stroke}
                strokeWidth={2.5}
                fill={`url(#customer-activity-gradient-${chartId}-${item.key})`}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: item.stroke,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 5,
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
