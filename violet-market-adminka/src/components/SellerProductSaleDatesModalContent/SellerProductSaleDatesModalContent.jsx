import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchSellerProductSaleDates } from '../../api/salesStatisticsAdminApi';
import { formatRevenue, formatStatNumber } from '../../utils/productDisplay';
import './SellerProductSaleDatesModalContent.css';

export default function SellerProductSaleDatesModalContent({
  sellerId = '',
  productId = 0,
  productTitle = '',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sales, setSales] = useState([]);
  const [title, setTitle] = useState(productTitle);

  const loadSaleDates = useCallback(async () => {
    if (!sellerId || !productId) return;

    setLoading(true);
    setError('');

    try {
      const payload = await fetchSellerProductSaleDates({ sellerId, productId });
      setSales(Array.isArray(payload.sales) ? payload.sales : []);
      setTitle(payload.productTitle || productTitle || `Mahsulot #${productId}`);
    } catch (err) {
      setSales([]);
      setError(err.message || 'Sotuv sanalarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [sellerId, productId, productTitle]);

  useEffect(() => {
    loadSaleDates();
  }, [loadSaleDates]);

  return (
    <div className="seller-product-sale-dates-modal">
      {productTitle || title ? (
        <p className="seller-product-sale-dates-modal__product">{title}</p>
      ) : null}

      {loading ? (
        <div className="seller-product-sale-dates-modal__state">
          <Spin size="small" />
        </div>
      ) : null}

      {!loading && error ? (
        <p className="seller-product-sale-dates-modal__error">{error}</p>
      ) : null}

      {!loading && !error && sales.length === 0 ? (
        <p className="seller-product-sale-dates-modal__empty">Sotuv sanasi topilmadi</p>
      ) : null}

      {!loading && !error && sales.length > 0 ? (
        <ul className="seller-product-sale-dates-modal__list">
          {sales.map((sale) => (
            <li key={`${sale.orderId}-${sale.rank}`} className="seller-product-sale-dates-modal__item">
              <span className="seller-product-sale-dates-modal__rank">{sale.rank}</span>
              <div className="seller-product-sale-dates-modal__info">
                <p className="seller-product-sale-dates-modal__date">{sale.soldAtLabel}</p>
                <p className="seller-product-sale-dates-modal__meta">
                  {formatStatNumber(sale.quantity)} ta · {formatRevenue(sale.amount)} · Buyurtma #
                  {sale.orderId}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
