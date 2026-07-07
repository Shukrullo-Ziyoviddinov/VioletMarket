import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchRejectedProducts } from '../../../api/paymentRequestsAdminApi';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestProductTitle,
} from '../../../utils/paymentRequestDisplay';
import './PaymentRequestRejectedProductsModalContent.css';

function buildProductSummary(product) {
  const count = Number(product.rejectionCount) || 0;
  if (product.isWithdrawn) {
    return `${count} marta rad etildi va tasdiqlandi`;
  }
  return `${count} marta rad etildi`;
}

export default function PaymentRequestRejectedProductsModalContent({ visible = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  const loadProducts = useCallback(async () => {
    if (!visible) return;

    setLoading(true);
    setError('');
    try {
      const rows = await fetchRejectedProducts();
      setProducts(rows);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'Rad etilgan mahsulotlarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (!visible) return null;

  if (loading) {
    return (
      <div className="payment-request-rejected-products-modal__state">
        <Spin />
      </div>
    );
  }

  if (error) {
    return <p className="payment-request-rejected-products-modal__state">{error}</p>;
  }

  if (!products.length) {
    return (
      <p className="payment-request-rejected-products-modal__state">
        Rad etilgan mahsulotlar topilmadi
      </p>
    );
  }

  return (
    <div className="payment-request-rejected-products-modal">
      <div className="payment-request-rejected-products-modal__list">
        {products.map((product) => (
          <article
            key={product.soldItemId}
            className="payment-request-rejected-products-modal__item"
          >
            <div className="payment-request-rejected-products-modal__product">
              <div className="payment-request-rejected-products-modal__product-body">
                <div className="payment-request-rejected-products-modal__image">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={getPaymentRequestProductTitle(product)}
                    />
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="payment-request-rejected-products-modal__product-content">
                  <strong>{getPaymentRequestProductTitle(product)}</strong>
                  <p>{product.productCode}</p>
                  <p>{product.sellerName}</p>
                  <p>{formatPaymentRequestAmount(product.amount)}</p>
                </div>
              </div>
              <span className="payment-request-rejected-products-modal__summary-badge">
                {buildProductSummary(product)}
              </span>
            </div>

            <div className="payment-request-rejected-products-modal__timeline">
              {product.rejections.map((rejection, index) => (
                <div
                  key={`${product.soldItemId}-${index}-${rejection.rejectedAt}`}
                  className="payment-request-rejected-products-modal__timeline-row"
                >
                  <span>Rad etildi:</span>
                  <strong>{formatPaymentRequestDateTime(rejection.rejectedAt)}</strong>
                  {rejection.comment ? (
                    <p className="payment-request-rejected-products-modal__comment">
                      {rejection.comment}
                    </p>
                  ) : null}
                </div>
              ))}

              {product.isWithdrawn && product.withdrawnAt ? (
                <div className="payment-request-rejected-products-modal__timeline-row payment-request-rejected-products-modal__timeline-row--approved">
                  <span>Tasdiqlandi:</span>
                  <strong>{formatPaymentRequestDateTime(product.withdrawnAt)}</strong>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
