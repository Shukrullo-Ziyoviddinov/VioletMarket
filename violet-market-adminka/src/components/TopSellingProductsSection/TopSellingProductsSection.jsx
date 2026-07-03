import React, { useCallback, useEffect, useState } from 'react';
import { fetchTopSellingProductsStatistics } from '../../api/salesStatisticsAdminApi';
import { useAdminModal } from '../../context/AdminModalContext';
import { useAdminToast } from '../../context/AdminToastContext';
import { buildProductDetailUrl, getLocalizedText } from '../../utils/productDisplay';
import TopSellingProductListItem from '../TopSellingProductListItem/TopSellingProductListItem';
import TopSellingProductsPeriodFilter from '../TopSellingProductsPeriodFilter/TopSellingProductsPeriodFilter';
import './TopSellingProductsSection.css';

export default function TopSellingProductsSection({ pageFilters }) {
  const { openAdminModal } = useAdminModal();
  const { showSuccess, showError } = useAdminToast();
  const [period, setPeriod] = useState('day');
  const [periodLabel, setPeriodLabel] = useState('Kunlik');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMenuProductId, setOpenMenuProductId] = useState(null);

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

  useEffect(() => {
    setOpenMenuProductId(null);
  }, [pageFilters, period]);

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
  };

  const handleOpenProductSellers = (product) => {
    openAdminModal({
      key: 'product-selling-sellers',
      label: getLocalizedText(product.title),
      productId: product.productId,
    });
  };

  const handleCopyProductLink = async (product) => {
    const productId = String(product?.productId || '').trim();
    if (!productId) return;

    const productUrl = buildProductDetailUrl(productId);
    if (!productUrl) return;

    try {
      await navigator.clipboard.writeText(productUrl);
      showSuccess('Mahsulot havolasi nusxalandi');
    } catch {
      showError('Mahsulot havolasini nusxalab bo\'lmadi');
    }
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
            <TopSellingProductListItem
              key={product.productId}
              product={product}
              isMenuOpen={openMenuProductId === product.productId}
              onMenuToggle={() =>
                setOpenMenuProductId((current) =>
                  current === product.productId ? null : product.productId,
                )
              }
              onMenuClose={() => setOpenMenuProductId(null)}
              onSellerClick={() => handleOpenProductSellers(product)}
              onCopyClick={() => handleCopyProductLink(product)}
            />
          ))
        )}
      </div>
    </section>
  );
}
