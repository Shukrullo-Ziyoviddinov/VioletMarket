import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import SalesCountryCategoryStatisticsPeriodFilter from '../SalesCountryCategoryStatisticsPeriodFilter/SalesCountryCategoryStatisticsPeriodFilter';
import './SalesCountryCategoryStatistics.css';

function formatPercentage(value) {
  const amount = Number(value) || 0;
  if (Number.isInteger(amount)) {
    return `${amount}%`;
  }
  return `${amount.toFixed(1)}%`;
}

export default function SalesCountryCategoryStatistics({
  countries = [],
  period = 'day',
  periodLabel = '',
  scopeLabel = '',
  loading = false,
  onPeriodChange,
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(countries) ? countries : []).map((item) => ({
        ...item,
        name: item.label || item.filterValue,
        value: item.quantity,
      })),
    [countries],
  );

  const hasData = chartData.length > 0;

  return (
    <section className="sales-country-category-statistics">
      <div className="sales-country-category-statistics__header">
        <div className="sales-country-category-statistics__heading">
          <h2 className="sales-country-category-statistics__title">Davlat statistikasi</h2>
          {scopeLabel ? (
            <p className="sales-country-category-statistics__subtitle">
              {periodLabel ? `${periodLabel} · ` : ''}
              {scopeLabel}
            </p>
          ) : null}
        </div>

        <SalesCountryCategoryStatisticsPeriodFilter
          value={period}
          onChange={onPeriodChange}
        />
      </div>

      {loading ? (
        <div className="sales-country-category-statistics__empty">Yuklanmoqda...</div>
      ) : !hasData ? (
        <div className="sales-country-category-statistics__empty">
          Tanlangan davr uchun davlat kategoriyasi bo&apos;yicha sotuv topilmadi
        </div>
      ) : (
        <div className="sales-country-category-statistics__body">
          <div className="sales-country-category-statistics__chart">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={chartData.length > 8 ? 1 : 2}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((item) => (
                    <Cell key={item.filterValue} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="sales-country-category-statistics__legend">
            {chartData.map((item) => (
              <li key={item.filterValue} className="sales-country-category-statistics__legend-item">
                <span
                  className="sales-country-category-statistics__legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="sales-country-category-statistics__legend-label">{item.name}</span>
                <span className="sales-country-category-statistics__legend-value">
                  {formatPercentage(item.percentage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
