import React, { useCallback, useEffect, useState } from 'react';
import { fetchTopSellersStatistics } from '../../api/salesStatisticsAdminApi';
import { formatRevenue, resolveProductImageUrl } from '../../utils/productDisplay';
import TopSellersPeriodFilter from '../TopSellersPeriodFilter/TopSellersPeriodFilter';
import './TopSellersSection.css';

export default function TopSellersSection({ pageFilters }) {
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('Kunlik');
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const loadTopSellers = useCallback(async (activePeriod, filters) => {
    if (!filters?.day && !filters?.week && !filters?.month) return;

    setLoading(true);
    try {
      const payload = await fetchTopSellersStatistics({
        ...filters,
        period: activePeriod,
      });
      setSellers(Array.isArray(payload.sellers) ? payload.sellers : []);
      setPeriodLabel(payload.periodLabel || 'Kunlik');
      if (payload.period) {
        setPeriod(payload.period);
      }
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopSellers(period, pageFilters);
  }, [loadTopSellers, pageFilters, period]);

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
  };

  return (
    <section className="top-sellers-section">
      <div className="top-sellers-section__header">
        <div className="top-sellers-section__heading">
          <h2 className="top-sellers-section__title">Eng ko&apos;p savdo qilgan sotuvchilar</h2>
          <p className="top-sellers-section__subtitle">
            {periodLabel} davr bo&apos;yicha eng yuqori savdo qilgan sotuvchilar
          </p>
        </div>
        <TopSellersPeriodFilter
          value={period}
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onChange={handlePeriodChange}
        />
      </div>

      <div className="top-sellers-section__list">
        {loading ? (
          <p className="top-sellers-section__empty">Yuklanmoqda...</p>
        ) : sellers.length === 0 ? (
          <p className="top-sellers-section__empty">
            Tanlangan davr uchun sotuvchi ma&apos;lumoti topilmadi
          </p>
        ) : (
          sellers.map((seller) => (
            <article key={seller.sellerId} className="top-sellers-section__item">
              <span className="top-sellers-section__rank">{seller.rank}</span>
              <img
                className="top-sellers-section__logo"
                src={resolveProductImageUrl(seller.logo)}
                alt={seller.name}
              />
              <div className="top-sellers-section__info">
                <h3 className="top-sellers-section__name">{seller.name}</h3>
                <p className="top-sellers-section__meta">
                  {seller.orderCount} ta buyurtma · {seller.totalQuantity} ta mahsulot
                </p>
              </div>
              <div className="top-sellers-section__amount">{formatRevenue(seller.totalAmount)}</div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
