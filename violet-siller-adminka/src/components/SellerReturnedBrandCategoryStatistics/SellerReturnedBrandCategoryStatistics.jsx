import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerReturnedBrandCategoryStatistics } from '../../api/sellerReturnedOrdersApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerReturnedStatisticsLegendModalContent from '../SellerReturnedStatisticsLegendModalContent/SellerReturnedStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import { useSellerStatisticsSubtitle } from '../../hooks/useSellerStatisticsSubtitle';
import './SellerReturnedBrandCategoryStatistics.css';

export default function SellerReturnedBrandCategoryStatistics({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { displayPeriodLabel, scopeLabel } = useSellerStatisticsSubtitle(
    period,
    pageFilters,
    'returnedOrders.brandStats',
  );

  const loadBrandStats = useCallback(
    async (activePeriod, filters) => {
      if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

      setLoading(true);
      try {
        const payload = await fetchSellerReturnedBrandCategoryStatistics(token, {
          ...filters,
          period: activePeriod,
        });
        setBrands(Array.isArray(payload.brands) ? payload.brands : []);
        if (payload.period) setPeriod(payload.period);
      } catch {
        setBrands([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

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
      <section className="seller-returned-brand-category-statistics">
        <div className="seller-returned-brand-category-statistics__header">
          <div className="seller-returned-brand-category-statistics__heading">
            <h2 className="seller-returned-brand-category-statistics__title">
              {t('returnedOrders.brandStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-returned-brand-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
            i18nNamespace="returnedOrders.brandStats"
          />
        </div>

        {loading ? (
          <div className="seller-returned-brand-category-statistics__empty">
            {t('returnedOrders.brandStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-returned-brand-category-statistics__empty">
            {t('returnedOrders.brandStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-returned-brand-category-statistics__body">
              <div className="seller-returned-brand-category-statistics__chart">
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

            <div className="seller-returned-brand-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('returnedOrders.brandStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerReturnedStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
          emptyKey="returnedOrders.brandStats.empty"
        />
      </GlobalModal>
    </>
  );
}
