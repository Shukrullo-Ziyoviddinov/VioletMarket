import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerReturnedCountryCategoryStatistics } from '../../api/sellerReturnedOrdersApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerReturnedStatisticsLegendModalContent from '../SellerReturnedStatisticsLegendModalContent/SellerReturnedStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import { useSellerStatisticsSubtitle } from '../../hooks/useSellerStatisticsSubtitle';
import './SellerReturnedCountryCategoryStatistics.css';

export default function SellerReturnedCountryCategoryStatistics({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { displayPeriodLabel, scopeLabel } = useSellerStatisticsSubtitle(
    period,
    pageFilters,
    'returnedOrders.countryStats',
  );

  const loadCountryStats = useCallback(
    async (activePeriod, filters) => {
      if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

      setLoading(true);
      try {
        const payload = await fetchSellerReturnedCountryCategoryStatistics(token, {
          ...filters,
          period: activePeriod,
        });
        setCountries(Array.isArray(payload.countries) ? payload.countries : []);
        if (payload.period) setPeriod(payload.period);
      } catch {
        setCountries([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadCountryStats(period, pageFilters);
  }, [loadCountryStats, pageFilters, period]);

  const chartData = useMemo(
    () =>
      countries.map((item) => ({
        ...item,
        name: item.label || item.filterValue,
        value: item.quantity,
      })),
    [countries],
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
      <section className="seller-returned-country-category-statistics">
        <div className="seller-returned-country-category-statistics__header">
          <div className="seller-returned-country-category-statistics__heading">
            <h2 className="seller-returned-country-category-statistics__title">
              {t('returnedOrders.countryStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-returned-country-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
            i18nNamespace="returnedOrders.countryStats"
          />
        </div>

        {loading ? (
          <div className="seller-returned-country-category-statistics__empty">
            {t('returnedOrders.countryStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-returned-country-category-statistics__empty">
            {t('returnedOrders.countryStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-returned-country-category-statistics__body">
              <div className="seller-returned-country-category-statistics__chart">
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

            <div className="seller-returned-country-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('returnedOrders.countryStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerReturnedStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
          emptyKey="returnedOrders.countryStats.empty"
        />
      </GlobalModal>
    </>
  );
}
