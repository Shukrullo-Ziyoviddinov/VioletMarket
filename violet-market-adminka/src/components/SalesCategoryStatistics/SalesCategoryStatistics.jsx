import React, { useCallback, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useAdminModal } from '../../context/AdminModalContext';
import SalesStatisticsChartLegend, { LEGEND_PREVIEW_LIMIT } from '../SalesStatisticsChartLegend/SalesStatisticsChartLegend';
import SalesStatisticsChartsPeriodFilter from '../SalesStatisticsChartsPeriodFilter/SalesStatisticsChartsPeriodFilter';
import SalesStatisticsMoreButton from '../SalesStatisticsMoreButton/SalesStatisticsMoreButton';
import './SalesCategoryStatistics.css';

export default function SalesCategoryStatistics({
  categories = [],
  period = 'day',
  periodLabel = '',
  scopeLabel = '',
  loading = false,
  onPeriodChange,
}) {
  const { openAdminModal } = useAdminModal();

  const chartData = useMemo(
    () =>
      (Array.isArray(categories) ? categories : []).map((item) => ({
        ...item,
        name: item.category,
        value: item.quantity,
      })),
    [categories],
  );

  const legendItems = useMemo(
    () =>
      chartData.map((item) => ({
        id: item.category,
        label: item.category,
        color: item.color,
        percentage: item.percentage,
      })),
    [chartData],
  );

  const hasData = chartData.length > 0;
  const hasMoreItems = legendItems.length > LEGEND_PREVIEW_LIMIT;

  const handleOpenMore = useCallback(() => {
    openAdminModal({
      key: 'sales-statistics-legend',
      label: 'Kategoriya statistikasi',
      periodLabel,
      scopeLabel,
      items: legendItems,
    });
  }, [legendItems, openAdminModal, periodLabel, scopeLabel]);

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

        <SalesStatisticsChartsPeriodFilter
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
        <>
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

            <SalesStatisticsChartLegend items={legendItems} />
          </div>

          <div className="sales-category-statistics__footer">
            {hasMoreItems ? <SalesStatisticsMoreButton onClick={handleOpenMore} /> : null}
          </div>
        </>
      )}
    </section>
  );
}
