import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTopSellersStatistics } from '../../api/salesStatisticsAdminApi';
import { useAdminModal } from '../../context/AdminModalContext';
import SalesStatisticsMoreButton from '../SalesStatisticsMoreButton/SalesStatisticsMoreButton';
import TopSellerListItem from '../TopSellerListItem/TopSellerListItem';
import TopSellersPeriodFilter from '../TopSellersPeriodFilter/TopSellersPeriodFilter';
import './TopSellersSection.css';

const PREVIEW_LIMIT = 4;

export default function TopSellersSection({ pageFilters }) {
  const { openAdminModal } = useAdminModal();
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('Kunlik');
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMenuSellerId, setOpenMenuSellerId] = useState(null);

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

  useEffect(() => {
    setOpenMenuSellerId(null);
  }, [pageFilters, period]);

  const previewSellers = useMemo(
    () => sellers.slice(0, PREVIEW_LIMIT),
    [sellers],
  );
  const hasMoreSellers = sellers.length > PREVIEW_LIMIT;

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
  };

  const handleOpenSellerInfo = (seller) => {
    openAdminModal({
      key: 'seller-sold-products',
      label: seller.name,
      sellerId: seller.sellerId,
    });
  };

  const handleOpenMore = useCallback(() => {
    openAdminModal({
      key: 'top-sellers-statistics-list',
      label: "Eng ko'p savdo qilgan sotuvchilar",
      periodLabel,
      sellers,
    });
  }, [openAdminModal, periodLabel, sellers]);

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

      <div className="top-sellers-section__content">
        <div className="top-sellers-section__list top-sellers-section__list--preview">
          {loading ? (
            <p className="top-sellers-section__empty">Yuklanmoqda...</p>
          ) : sellers.length === 0 ? (
            <p className="top-sellers-section__empty">
              Tanlangan davr uchun sotuvchi ma&apos;lumoti topilmadi
            </p>
          ) : (
            previewSellers.map((seller) => (
              <TopSellerListItem
                key={seller.sellerId}
                seller={seller}
                isMenuOpen={openMenuSellerId === seller.sellerId}
                onMenuToggle={() =>
                  setOpenMenuSellerId((current) =>
                    current === seller.sellerId ? null : seller.sellerId,
                  )
                }
                onMenuClose={() => setOpenMenuSellerId(null)}
                onInfoClick={() => handleOpenSellerInfo(seller)}
              />
            ))
          )}
        </div>

        {!loading && hasMoreSellers ? (
          <div className="top-sellers-section__footer">
            <SalesStatisticsMoreButton onClick={handleOpenMore} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
