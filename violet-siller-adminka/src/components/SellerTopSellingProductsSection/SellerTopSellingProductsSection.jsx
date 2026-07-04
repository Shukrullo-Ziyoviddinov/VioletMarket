import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchSellerTopSellingProducts } from '../../api/sellerSalesStatisticsApi';
import { buildSellerProductDetailUrl } from '../../utils/sellerProductDisplay';
import GlobalModal from '../GlobalModal/GlobalModal';
import SellerSalesStatisticsMoreButton from '../SellerSalesStatisticsMoreButton/SellerSalesStatisticsMoreButton';
import SellerTopSellingProductListItem from '../SellerTopSellingProductListItem/SellerTopSellingProductListItem';
import SellerTopSellingProductsModalContent from '../SellerTopSellingProductsModalContent/SellerTopSellingProductsModalContent';
import SellerTopSellingProductsPeriodFilter from '../SellerTopSellingProductsPeriodFilter/SellerTopSellingProductsPeriodFilter';
import './SellerTopSellingProductsSection.css';

const PREVIEW_LIMIT = 4;

const PERIOD_LABEL_KEYS = {
  day: 'salesStatistics.topProducts.period.day',
  week: 'salesStatistics.topProducts.period.week',
  month: 'salesStatistics.topProducts.period.month',
};

export default function SellerTopSellingProductsSection({ token, pageFilters }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMenuProductId, setOpenMenuProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const periodLabel = t(PERIOD_LABEL_KEYS[period] || PERIOD_LABEL_KEYS.day);

  const loadTopProducts = useCallback(async (activePeriod, filters) => {
    if (!token || (!filters?.day && !filters?.week && !filters?.month)) return;

    setLoading(true);
    try {
      const payload = await fetchSellerTopSellingProducts(token, {
        ...filters,
        period: activePeriod,
      });
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      if (payload.period) {
        setPeriod(payload.period);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTopProducts(period, pageFilters);
  }, [loadTopProducts, pageFilters, period]);

  useEffect(() => {
    setOpenMenuProductId(null);
  }, [pageFilters, period]);

  const previewProducts = useMemo(
    () => products.slice(0, PREVIEW_LIMIT),
    [products],
  );
  const hasMoreProducts = products.length > PREVIEW_LIMIT;

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
  };

  const handleCopyProductLink = async (product) => {
    const productId = String(product?.productId || '').trim();
    if (!productId) return;

    const productUrl = buildSellerProductDetailUrl(productId);
    if (!productUrl) return;

    try {
      await navigator.clipboard.writeText(productUrl);
      message.success(t('salesStatistics.topProducts.copySuccess'));
    } catch {
      message.error(t('salesStatistics.topProducts.copyError'));
    }
  };

  return (
    <>
      <section className="seller-top-selling-products-section">
        <div className="seller-top-selling-products-section__header">
          <div className="seller-top-selling-products-section__heading">
            <h2 className="seller-top-selling-products-section__title">
              {t('salesStatistics.topProducts.title')}
            </h2>
            <p className="seller-top-selling-products-section__subtitle">
              {t('salesStatistics.topProducts.subtitle', { period: periodLabel })}
            </p>
          </div>
          <SellerTopSellingProductsPeriodFilter
            value={period}
            open={filterOpen}
            onOpenChange={setFilterOpen}
            onChange={handlePeriodChange}
          />
        </div>

        <div className="seller-top-selling-products-section__content">
          <div className="seller-top-selling-products-section__list seller-top-selling-products-section__list--preview">
            {loading ? (
              <p className="seller-top-selling-products-section__empty">
                {t('salesStatistics.topProducts.loading')}
              </p>
            ) : products.length === 0 ? (
              <p className="seller-top-selling-products-section__empty">
                {t('salesStatistics.topProducts.empty')}
              </p>
            ) : (
              previewProducts.map((product) => (
                <SellerTopSellingProductListItem
                  key={product.productId}
                  product={product}
                  isMenuOpen={openMenuProductId === product.productId}
                  onMenuToggle={() =>
                    setOpenMenuProductId((current) =>
                      current === product.productId ? null : product.productId,
                    )
                  }
                  onMenuClose={() => setOpenMenuProductId(null)}
                  onCopyClick={() => handleCopyProductLink(product)}
                />
              ))
            )}
          </div>

          {!loading && hasMoreProducts ? (
            <div className="seller-top-selling-products-section__footer">
              <SellerSalesStatisticsMoreButton onClick={() => setModalOpen(true)} />
            </div>
          ) : null}
        </div>
      </section>

      <GlobalModal
        open={modalOpen}
        title={t('salesStatistics.topProducts.modalTitle')}
        onClose={() => setModalOpen(false)}
      >
        <SellerTopSellingProductsModalContent
          periodLabel={periodLabel}
          products={products}
        />
      </GlobalModal>
    </>
  );
}
