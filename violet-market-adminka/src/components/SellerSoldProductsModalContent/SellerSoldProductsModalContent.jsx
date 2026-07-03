import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchSellerSoldProductsStatistics } from '../../api/salesStatisticsAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import { useMiniGlobalModal } from '../../context/MiniGlobalModalContext';
import {
  buildProductDetailUrl,
  formatRevenue,
  formatStatNumber,
  getLocalizedText,
  resolveProductImageUrl,
} from '../../utils/productDisplay';
import SellerSoldProductStatusBadge from '../SellerSoldProductStatusBadge/SellerSoldProductStatusBadge';
import './SellerSoldProductsModalContent.css';

function formatRemainingQuantity(value, statusKey) {
  if (statusKey === 'deleted' || value == null) {
    return "Ma'lumot yo'q";
  }
  return `${formatStatNumber(value)} ta qolgan`;
}

export default function SellerSoldProductsModalContent({
  visible = false,
  sellerId = '',
}) {
  const { openMiniGlobalViewModal } = useMiniGlobalModal();
  const { showSuccess, showError } = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  const loadData = useCallback(async () => {
    if (!visible || !sellerId) return;

    setLoading(true);
    setError('');
    setPayload(null);

    try {
      const data = await fetchSellerSoldProductsStatistics({ sellerId });
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || "Sotuvchi mahsulotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [visible, sellerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!visible) return null;

  const seller = payload?.seller;
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const periodLabel = payload?.periodLabel || 'Barcha davr';

  const handleOpenSaleDates = (product) => {
    openMiniGlobalViewModal({
      viewKey: 'seller-product-sale-dates',
      viewTitle: 'Sotuv sanalari',
      viewProps: {
        sellerId,
        productId: product.productId,
        productTitle: getLocalizedText(product.title),
      },
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
    <div className="seller-sold-products-modal">
      {loading ? (
        <div className="seller-sold-products-modal__state">
          <Spin />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="seller-sold-products-modal__state seller-sold-products-modal__state--error">
          {error}
        </div>
      ) : null}

      {!loading && !error && seller ? (
        <>
          <div className="seller-sold-products-modal__seller">
            <img
              className="seller-sold-products-modal__seller-logo"
              src={resolveProductImageUrl(seller.logo)}
              alt={seller.name}
            />
            <div className="seller-sold-products-modal__seller-info">
              <h3 className="seller-sold-products-modal__seller-name">{seller.name}</h3>
              <p className="seller-sold-products-modal__seller-meta">
                {periodLabel} · {seller.orderCount} ta buyurtma · {seller.totalQuantity} ta sotilgan
              </p>
            </div>
            <div className="seller-sold-products-modal__seller-amount">
              {formatRevenue(seller.totalAmount)}
            </div>
          </div>

          <div className="seller-sold-products-modal__list">
            {products.length === 0 ? (
              <p className="seller-sold-products-modal__empty">
                Sotuvchi bo&apos;yicha sotilgan mahsulot topilmadi
              </p>
            ) : (
              products.map((product) => (
                <article key={product.productId} className="seller-sold-products-modal__item">
                  <span className="seller-sold-products-modal__rank">{product.rank}</span>
                  <img
                    className="seller-sold-products-modal__image"
                    src={resolveProductImageUrl(product.image)}
                    alt={getLocalizedText(product.title)}
                  />
                  <div className="seller-sold-products-modal__info">
                    <h4 className="seller-sold-products-modal__name">
                      {getLocalizedText(product.title)}
                    </h4>
                    <p className="seller-sold-products-modal__meta">
                      {product.orderCount} ta buyurtma · {product.totalQuantity} ta sotilgan ·{' '}
                      {formatRemainingQuantity(product.remainingQuantity, product.statusKey)}
                    </p>
                    <div className="seller-sold-products-modal__actions">
                      <button
                        type="button"
                        className="seller-sold-products-modal__action-btn"
                        onClick={() => handleOpenSaleDates(product)}
                      >
                        Sotuv sana
                      </button>
                      <button
                        type="button"
                        className="seller-sold-products-modal__action-btn"
                        onClick={() => handleCopyProductLink(product)}
                      >
                        Nusxalash
                      </button>
                    </div>
                  </div>
                  <div className="seller-sold-products-modal__side">
                    <SellerSoldProductStatusBadge
                      statusKey={product.statusKey}
                      label={product.statusLabel}
                    />
                    <div className="seller-sold-products-modal__amount">
                      {formatRevenue(product.totalAmount)}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
