import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchProductSellingSellersStatistics } from '../../api/salesStatisticsAdminApi';
import {
  formatRevenue,
  getLocalizedText,
  resolveProductImageUrl,
} from '../../utils/productDisplay';
import './ProductSellingSellersModalContent.css';

export default function ProductSellingSellersModalContent({
  visible = false,
  productId = 0,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  const loadData = useCallback(async () => {
    if (!visible || !productId) return;

    setLoading(true);
    setError('');
    setPayload(null);

    try {
      const data = await fetchProductSellingSellersStatistics({ productId });
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || 'Sotuvchilar ma\'lumotini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [visible, productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!visible) return null;

  const product = payload?.product;
  const sellers = Array.isArray(payload?.sellers) ? payload.sellers : [];
  const periodLabel = payload?.periodLabel || 'Barcha davr';

  return (
    <div className="product-selling-sellers-modal">
      {loading ? (
        <div className="product-selling-sellers-modal__state">
          <Spin />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="product-selling-sellers-modal__state product-selling-sellers-modal__state--error">
          {error}
        </div>
      ) : null}

      {!loading && !error && product ? (
        <>
          <div className="product-selling-sellers-modal__product">
            <img
              className="product-selling-sellers-modal__product-image"
              src={resolveProductImageUrl(product.image)}
              alt={getLocalizedText(product.title)}
            />
            <div className="product-selling-sellers-modal__product-info">
              <h3 className="product-selling-sellers-modal__product-name">
                {getLocalizedText(product.title)}
              </h3>
              <p className="product-selling-sellers-modal__product-meta">
                {periodLabel} · {product.orderCount} ta buyurtma · {product.totalQuantity} ta sotilgan
              </p>
            </div>
            <div className="product-selling-sellers-modal__product-amount">
              {formatRevenue(product.totalAmount)}
            </div>
          </div>

          <div className="product-selling-sellers-modal__list">
            {sellers.length === 0 ? (
              <p className="product-selling-sellers-modal__empty">
                Ushbu mahsulotni sotgan sotuvchi topilmadi
              </p>
            ) : (
              sellers.map((seller) => (
                <article key={seller.sellerId} className="product-selling-sellers-modal__item">
                  <span className="product-selling-sellers-modal__rank">{seller.rank}</span>
                  <img
                    className="product-selling-sellers-modal__logo"
                    src={resolveProductImageUrl(seller.logo)}
                    alt={seller.name}
                  />
                  <div className="product-selling-sellers-modal__info">
                    <h4 className="product-selling-sellers-modal__name">{seller.name}</h4>
                    <p className="product-selling-sellers-modal__meta">
                      {seller.orderCount} ta buyurtma · {seller.totalQuantity} ta sotilgan
                    </p>
                  </div>
                  <div className="product-selling-sellers-modal__amount">
                    {formatRevenue(seller.totalAmount)}
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
