import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatStatNumber } from '../../utils/productDisplay';
import SalesCategoryStatisticsPeriodFilter from '../SalesCategoryStatisticsPeriodFilter/SalesCategoryStatisticsPeriodFilter';
import './SalesCategoryStatistics.css';

function formatPercentage(value) {
  const amount = Number(value) || 0;
  if (Number.isInteger(amount)) {
    return `${amount}%`;
  }
  return `${amount.toFixed(1)}%`;
}

export default function SalesCategoryStatistics({
  categories = [],
  period = 'day',
  periodLabel = '',
  scopeLabel = '',
  loading = false,
  onPeriodChange,
}) {
  const chartData = useMemo(
    () =>
      (Array.isArray(categories) ? categories : []).map((item) => ({
        ...item,
        name: item.category,
        value: item.quantity,
      })),
    [categories],
  );

  const hasData = chartData.length > 0;

  return (
    <section className="sales-category-statistics">
      <div className="sales-category-statistics__header">
        <div className="sales-category-statistics__heading">
          <h2 className="sales-category-statistics__title">Kategoriya statistikasi</h2>
          {scopeLabel ? (
            <p className="sales-category-statistics__subtitle">
              {periodLabel ? `${periodLabel} · ` : ''}
              {scopeLabel}
            </p>
          ) : null}
        </div>

        <SalesCategoryStatisticsPeriodFilter
          value={period}
          onChange={onPeriodChange}
        />
      </div>

      {loading ? (
        <div className="sales-category-statistics__empty">Yuklanmoqda...</div>
      ) : !hasData ? (
        <div className="sales-category-statistics__empty">
          Tanlangan davr uchun kategoriya bo&apos;yicha sotuv topilmadi
        </div>
      ) : (
        <div className="sales-category-statistics__body">
          <div className="sales-category-statistics__chart">
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
                    <Cell key={item.category} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="sales-category-statistics__legend">
            {chartData.map((item) => (
              <li key={item.category} className="sales-category-statistics__legend-item">
                <span
                  className="sales-category-statistics__legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="sales-category-statistics__legend-label">{item.category}</span>
                <span className="sales-category-statistics__legend-value">
                  {formatPercentage(item.percentage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasData && !loading ? (
        <p className="sales-category-statistics__footnote">
          Jami {formatStatNumber(chartData.reduce((sum, item) => sum + item.value, 0))} ta sotilgan
        </p>
      ) : null}
    </section>
  );
}
