import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerCategorySalesStatistics } from '../../api/sellerSalesStatisticsApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerSalesCategoryStatisticsLegendModalContent from '../SellerSalesCategoryStatisticsLegendModalContent/SellerSalesCategoryStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import './SellerSalesCategoryStatistics.css';

const PERIOD_LABEL_KEYS = {
  day: 'salesStatistics.categoryStats.periodLabel.day',
  week: 'salesStatistics.categoryStats.periodLabel.week',
  month: 'salesStatistics.categoryStats.periodLabel.month',
};

export default function SellerSalesCategoryStatistics({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('');
  const [scopeLabel, setScopeLabel] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCategoryStats = useCallback(async (activePeriod, filters) => {
    if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

    setLoading(true);
    try {
      const payload = await fetchSellerCategorySalesStatistics(token, {
        ...filters,
        period: activePeriod,
      });
      setCategories(Array.isArray(payload.categories) ? payload.categories : []);
      setScopeLabel(payload.scopeLabel || '');
      if (payload.period) {
        setPeriod(payload.period);
      }
      setPeriodLabel(
        payload.periodLabel
          || t(PERIOD_LABEL_KEYS[payload.period] || PERIOD_LABEL_KEYS.day),
      );
    } catch {
      setCategories([]);
      setScopeLabel('');
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    loadCategoryStats(period, pageFilters);
  }, [loadCategoryStats, pageFilters, period]);

  const chartData = useMemo(
    () =>
      categories.map((item) => ({
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
  const hasMoreItems = legendItems.length > SELLER_LEGEND_PREVIEW_LIMIT;
  const displayPeriodLabel = periodLabel || t(PERIOD_LABEL_KEYS[period] || PERIOD_LABEL_KEYS.day);

  return (
    <>
      <section className="seller-sales-category-statistics">
        <div className="seller-sales-category-statistics__header">
          <div className="seller-sales-category-statistics__heading">
            <h2 className="seller-sales-category-statistics__title">
              {t('salesStatistics.categoryStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-sales-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
          />
        </div>

        {loading ? (
          <div className="seller-sales-category-statistics__empty">
            {t('salesStatistics.categoryStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-sales-category-statistics__empty">
            {t('salesStatistics.categoryStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-sales-category-statistics__body">
              <div className="seller-sales-category-statistics__chart">
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

            <div className="seller-sales-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('salesStatistics.categoryStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerSalesCategoryStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
        />
      </GlobalModal>
    </>
  );
}
