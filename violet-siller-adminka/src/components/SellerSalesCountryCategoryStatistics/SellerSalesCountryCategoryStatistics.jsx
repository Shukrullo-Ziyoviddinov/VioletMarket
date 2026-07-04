import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { fetchSellerCountryCategorySalesStatistics } from '../../api/sellerSalesStatisticsApi';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerSalesCountryCategoryStatisticsLegendModalContent from '../SellerSalesCountryCategoryStatisticsLegendModalContent/SellerSalesCountryCategoryStatisticsLegendModalContent';
import SellerSalesStatisticsChartLegend, {
  SELLER_LEGEND_PREVIEW_LIMIT,
} from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import SellerSalesStatisticsChartsPeriodFilter from '../SellerSalesStatisticsChartsPeriodFilter/SellerSalesStatisticsChartsPeriodFilter';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import './SellerSalesCountryCategoryStatistics.css';

const PERIOD_LABEL_KEYS = {
  day: 'salesStatistics.countryStats.periodLabel.day',
  week: 'salesStatistics.countryStats.periodLabel.week',
  month: 'salesStatistics.countryStats.periodLabel.month',
};

export default function SellerSalesCountryCategoryStatistics({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('');
  const [scopeLabel, setScopeLabel] = useState('');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCountryStats = useCallback(async (activePeriod, filters) => {
    if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

    setLoading(true);
    try {
      const payload = await fetchSellerCountryCategorySalesStatistics(token, {
        ...filters,
        period: activePeriod,
      });
      setCountries(Array.isArray(payload.countries) ? payload.countries : []);
      setScopeLabel(payload.scopeLabel || '');
      if (payload.period) {
        setPeriod(payload.period);
      }
      setPeriodLabel(
        payload.periodLabel
          || t(PERIOD_LABEL_KEYS[payload.period] || PERIOD_LABEL_KEYS.day),
      );
    } catch {
      setCountries([]);
      setScopeLabel('');
    } finally {
      setLoading(false);
    }
  }, [t, token]);

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
  const displayPeriodLabel = periodLabel || t(PERIOD_LABEL_KEYS[period] || PERIOD_LABEL_KEYS.day);

  return (
    <>
      <section className="seller-sales-country-category-statistics">
        <div className="seller-sales-country-category-statistics__header">
          <div className="seller-sales-country-category-statistics__heading">
            <h2 className="seller-sales-country-category-statistics__title">
              {t('salesStatistics.countryStats.title')}
            </h2>
            {scopeLabel ? (
              <p className="seller-sales-country-category-statistics__subtitle">
                {displayPeriodLabel ? `${displayPeriodLabel} · ` : ''}
                {scopeLabel}
              </p>
            ) : null}
          </div>

          <SellerSalesStatisticsChartsPeriodFilter
            value={period}
            onChange={setPeriod}
            i18nNamespace="salesStatistics.countryStats"
          />
        </div>

        {loading ? (
          <div className="seller-sales-country-category-statistics__empty">
            {t('salesStatistics.countryStats.loading')}
          </div>
        ) : !hasData ? (
          <div className="seller-sales-country-category-statistics__empty">
            {t('salesStatistics.countryStats.empty')}
          </div>
        ) : (
          <>
            <div className="seller-sales-country-category-statistics__body">
              <div className="seller-sales-country-category-statistics__chart">
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

            <div className="seller-sales-country-category-statistics__footer">
              {hasMoreItems ? (
                <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
              ) : null}
            </div>
          </>
        )}
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('salesStatistics.countryStats.title')}
        onClose={() => setModalOpen(false)}
      >
        <SellerSalesCountryCategoryStatisticsLegendModalContent
          periodLabel={displayPeriodLabel}
          scopeLabel={scopeLabel}
          items={legendItems}
        />
      </GlobalModal>
    </>
  );
}
