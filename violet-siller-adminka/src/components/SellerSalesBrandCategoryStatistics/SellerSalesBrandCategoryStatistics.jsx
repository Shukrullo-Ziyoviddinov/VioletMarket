import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerBrandCategorySalesStatistics } from '../../api/sellerSalesStatisticsApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerSalesBrandCategoryStatisticsLegendModalContent from '../SellerSalesBrandCategoryStatisticsLegendModalContent/SellerSalesBrandCategoryStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import { useSellerStatisticsSubtitle } from '../../hooks/useSellerStatisticsSubtitle';
import './SellerSalesBrandCategoryStatistics.css';

export default function SellerSalesBrandCategoryStatistics({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { displayPeriodLabel, scopeLabel } = useSellerStatisticsSubtitle(
    period,
    pageFilters,
    'salesStatistics.brandStats',
  );

  const loadBrandStats = useCallback(async (activePeriod, filters) => {
    if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

    setLoading(true);
    try {
      const payload = await fetchSellerBrandCategorySalesStatistics(token, {
        ...filters,
        period: activePeriod,
      });
      setBrands(Array.isArray(payload.brands) ? payload.brands : []);
      if (payload.period) {
        setPeriod(payload.period);
      }
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBrandStats(period, pageFilters);
  }, [loadBrandStats, pageFilters, period]);

  const chartData = useMemo(
    () =>
      brands.map((item) => ({
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
  const hasMoreItems = legendItems.length > SELLER_LEGEND_PREVIEW_LIMIT;

  return (
    <>
      <section className="seller-sales-brand-category-statistics">
        <div className="seller-sales-brand-category-statistics__header">
          <div className="seller-sales-brand-category-statistics__heading">
            <h2 className="seller-sales-brand-category-statistics__title">
              {t('salesStatistics.brandStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-sales-brand-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
            i18nNamespace="salesStatistics.brandStats"
          />
        </div>

        {loading ? (
          <div className="seller-sales-brand-category-statistics__empty">
            {t('salesStatistics.brandStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-sales-brand-category-statistics__empty">
            {t('salesStatistics.brandStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-sales-brand-category-statistics__body">
              <div className="seller-sales-brand-category-statistics__chart">
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

              <SellerSalesStatisticsChartLegend items={legendItems} />
            </div>

            <div className="seller-sales-brand-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('salesStatistics.brandStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerSalesBrandCategoryStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
        />
      </GlobalModal>
    </>
  );
}
