import React, { useCallback, useEffect, useState } from 'react';
import { fetchTopSellingProductsStatistics } from '../../api/salesStatisticsAdminApi';
import { formatRevenue, getLocalizedText, resolveProductImageUrl } from '../../utils/productDisplay';
import TopSellingProductsPeriodFilter from '../TopSellingProductsPeriodFilter/TopSellingProductsPeriodFilter';
import './TopSellingProductsSection.css';

export default function TopSellingProductsSection({ pageFilters }) {
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('Kunlik');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const loadTopProducts = useCallback(async (activePeriod, filters) => {
    if (!filters?.day && !filters?.week && !filters?.month) return;

    setLoading(true);
    try {
      const payload = await fetchTopSellingProductsStatistics({
        ...filters,
        period: activePeriod,
      });
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setPeriodLabel(payload.periodLabel || 'Kunlik');
      if (payload.period) {
        setPeriod(payload.period);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopProducts(period, pageFilters);
  }, [loadTopProducts, pageFilters, period]);

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
  };

  return (
    <section className="top-selling-products-section">
      <div className="top-selling-products-section__header">
        <div className="top-selling-products-section__heading">
          <h2 className="top-selling-products-section__title">Eng ko&apos;p sotilgan mahsulotlar</h2>
          <p className="top-selling-products-section__subtitle">
            {periodLabel} davr bo&apos;yicha eng ko&apos;p sotilgan mahsulotlar
          </p>
        </div>
        <TopSellingProductsPeriodFilter
          value={period}
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onChange={handlePeriodChange}
        />
      </div>

      <div className="top-selling-products-section__list">
        {loading ? (
          <p className="top-selling-products-section__empty">Yuklanmoqda...</p>
        ) : products.length === 0 ? (
          <p className="top-selling-products-section__empty">
            Tanlangan davr uchun mahsulot ma&apos;lumoti topilmadi
          </p>
        ) : (
          products.map((product) => (
            <article key={product.productId} className="top-selling-products-section__item">
              <span className="top-selling-products-section__rank">{product.rank}</span>
              <img
                className="top-selling-products-section__image"
                src={resolveProductImageUrl(product.image)}
                alt={getLocalizedText(product.title)}
              />
              <div className="top-selling-products-section__info">
                <h3 className="top-selling-products-section__name">
                  {getLocalizedText(product.title)}
                </h3>
                <p className="top-selling-products-section__meta">
                  {product.orderCount} ta buyurtma · {product.totalQuantity} ta sotilgan
                </p>
              </div>
              <div className="top-selling-products-section__amount">
                {formatRevenue(product.totalAmount)}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
