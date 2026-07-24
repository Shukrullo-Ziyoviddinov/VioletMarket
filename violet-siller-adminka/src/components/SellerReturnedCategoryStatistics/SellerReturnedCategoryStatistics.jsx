import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerReturnedCategoryStatistics } from '../../api/sellerReturnedOrdersApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerReturnedStatisticsLegendModalContent from '../SellerReturnedStatisticsLegendModalContent/SellerReturnedStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import { useSellerStatisticsSubtitle } from '../../hooks/useSellerStatisticsSubtitle';
import { getMasterCategoryDisplayLabelFromStat } from '../../utils/masterCategoryDisplay';
import './SellerReturnedCategoryStatistics.css';

export default function SellerReturnedCategoryStatistics({ token, pageFilters }) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { displayPeriodLabel, scopeLabel } = useSellerStatisticsSubtitle(
    period,
    pageFilters,
    'returnedOrders.categoryStats',
  );

  const loadCategoryStats = useCallback(
    async (activePeriod, filters) => {
      if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

      setLoading(true);
      try {
        const payload = await fetchSellerReturnedCategoryStatistics(token, {
          ...filters,
          period: activePeriod,
        });
        setCategories(Array.isArray(payload.categories) ? payload.categories : []);
        if (payload.period) setPeriod(payload.period);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadCategoryStats(period, pageFilters);
  }, [loadCategoryStats, pageFilters, period]);

  const chartData = useMemo(
    () =>
      categories.map((item) => ({
        ...item,
        name: getMasterCategoryDisplayLabelFromStat(item, i18n.language),
        value: item.quantity,
      })),
    [categories, i18n.language],
  );

  const legendItems = useMemo(
    () =>
      chartData.map((item) => ({
        id: item.category,
        label: getMasterCategoryDisplayLabelFromStat(item, i18n.language),
        color: item.color,
        percentage: item.percentage,
      })),
    [chartData, i18n.language],
  );

  const hasData = chartData.length > 0;
  const hasMoreItems = legendItems.length > SELLER_LEGEND_PREVIEW_LIMIT;

  return (
    <>
      <section className="seller-returned-category-statistics">
        <div className="seller-returned-category-statistics__header">
          <div className="seller-returned-category-statistics__heading">
            <h2 className="seller-returned-category-statistics__title">
              {t('returnedOrders.categoryStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-returned-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
            i18nNamespace="returnedOrders.categoryStats"
          />
        </div>

        {loading ? (
          <div className="seller-returned-category-statistics__empty">
            {t('returnedOrders.categoryStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-returned-category-statistics__empty">
            {t('returnedOrders.categoryStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-returned-category-statistics__body">
              <div className="seller-returned-category-statistics__chart">
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

              <SellerSalesStatisticsChartLegend items={legendItems} />
            </div>

            <div className="seller-returned-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('returnedOrders.categoryStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerReturnedStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
          emptyKey="returnedOrders.categoryStats.empty"
        />
      </GlobalModal>
    </>
  );
}
