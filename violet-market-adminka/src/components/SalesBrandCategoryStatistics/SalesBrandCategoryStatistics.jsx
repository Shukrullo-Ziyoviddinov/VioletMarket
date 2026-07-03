import React, { useCallback, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useAdminModal } from '../../context/AdminModalContext';
import SalesStatisticsChartLegend, { LEGEND_PREVIEW_LIMIT } from '../SalesStatisticsChartLegend/SalesStatisticsChartLegend';
import SalesStatisticsChartsPeriodFilter from '../SalesStatisticsChartsPeriodFilter/SalesStatisticsChartsPeriodFilter';
import SalesStatisticsMoreButton from '../SalesStatisticsMoreButton/SalesStatisticsMoreButton';
import './SalesBrandCategoryStatistics.css';

export default function SalesBrandCategoryStatistics({
  brands = [],
  period = 'day',
  periodLabel = '',
  scopeLabel = '',
  loading = false,
  onPeriodChange,
}) {
  const { openAdminModal } = useAdminModal();

  const chartData = useMemo(
    () =>
      (Array.isArray(brands) ? brands : []).map((item) => ({
        ...item,
        name: item.label || item.filterValue,
        value: item.quantity,
      })),
    [brands],
  );

  const legendItems = useMemo(
    () =>
      chartData.map((item) => ({
        id: item.filterValue,
        label: item.name,
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
      label: 'Brend statistikasi',
      periodLabel,
      scopeLabel,
      items: legendItems,
    });
  }, [legendItems, openAdminModal, periodLabel, scopeLabel]);

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

        <SalesStatisticsChartsPeriodFilter
          value={period}
          onChange={onPeriodChange}
        />
      </div>

      {loading ? (
        <div className="sales-brand-category-statistics__empty">Yuklanmoqda...</div>
      ) : !hasData ? (
        <div className="sales-brand-category-statistics__empty">
          Tanlangan davr uchun brend bo&apos;yicha sotuv topilmadi
        </div>
      ) : (
        <>
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

            <SalesStatisticsChartLegend items={legendItems} />
          </div>

          <div className="sales-brand-category-statistics__footer">
            {hasMoreItems ? <SalesStatisticsMoreButton onClick={handleOpenMore} /> : null}
          </div>
        </>
      )}
    </section>
  );
}
