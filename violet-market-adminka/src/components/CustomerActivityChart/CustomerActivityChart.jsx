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
  CUSTOMER_ACTIVITY_MOCK_DATA,
  CUSTOMER_ACTIVITY_SERIES,
  CUSTOMER_ACTIVITY_Y_TICKS,
} from './customerActivityMock';
import './CustomerActivityChart.css';

function formatYAxisTick(value) {
  return value.toLocaleString('en-US');
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
  data = CUSTOMER_ACTIVITY_MOCK_DATA,
  filterOptions = CUSTOMER_ACTIVITY_FILTER_OPTIONS,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const visibleSeries = useMemo(() => {
    if (activeFilter === 'all') {
      return CUSTOMER_ACTIVITY_SERIES;
    }

    return CUSTOMER_ACTIVITY_SERIES.filter((item) => item.key === activeFilter);
  }, [activeFilter]);

  return (
    <section className="customer-activity-chart">
      <div className="customer-activity-chart__header">
        <h2 className="customer-activity-chart__title">
          Ro'yxatdan o'tgan mijozlar faolligi
        </h2>

        <Select
          className="customer-activity-chart__filter"
          value={activeFilter}
          options={filterOptions}
          onChange={setActiveFilter}
        />
      </div>

      <CustomerActivityLegend series={CUSTOMER_ACTIVITY_SERIES} activeFilter={activeFilter} />

      <div className="customer-activity-chart__canvas">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
            <defs>
              {CUSTOMER_ACTIVITY_SERIES.map((item) => (
                <linearGradient
                  key={item.key}
                  id={`customer-activity-gradient-${item.key}`}
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
              ticks={CUSTOMER_ACTIVITY_Y_TICKS}
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
                fill={`url(#customer-activity-gradient-${item.key})`}
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
      </div>
    </section>
  );
}
