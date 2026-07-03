import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import './SalesBrandCategoryStatistics.css';

function formatPercentage(value) {
  const amount = Number(value) || 0;
  if (Number.isInteger(amount)) {
    return `${amount}%`;
  }
  return `${amount.toFixed(1)}%`;
}

export default function SalesBrandCategoryStatistics({
  brands = [],
  periodLabel = '',
  scopeLabel = '',
  loading = false,
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(brands) ? brands : []).map((item) => ({
        ...item,
        name: item.label || item.filterValue,
        value: item.quantity,
      })),
    [brands],
  );

  const hasData = chartData.length > 0;

  return (
    <section className="sales-brand-category-statistics">
      <div className="sales-brand-category-statistics__header">
        <div className="sales-brand-category-statistics__heading">
          <h2 className="sales-brand-category-statistics__title">Brend statistikasi</h2>
          {scopeLabel ? (
            <p className="sales-brand-category-statistics__subtitle">
              {periodLabel ? `${periodLabel} · ` : ''}
              {scopeLabel}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="sales-brand-category-statistics__empty">Yuklanmoqda...</div>
      ) : !hasData ? (
        <div className="sales-brand-category-statistics__empty">
          Tanlangan davr uchun brend bo&apos;yicha sotuv topilmadi
        </div>
      ) : (
        <div className="sales-brand-category-statistics__body">
          <div className="sales-brand-category-statistics__chart">
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

          <ul className="sales-brand-category-statistics__legend">
            {chartData.map((item) => (
              <li key={item.filterValue} className="sales-brand-category-statistics__legend-item">
                <span
                  className="sales-brand-category-statistics__legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="sales-brand-category-statistics__legend-label">{item.name}</span>
                <span className="sales-brand-category-statistics__legend-value">
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
