import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { fetchAllSellerSoldItemsByStatus } from '../../../api/sellerEarningsApi';
import {
  formatSellerEarningsAmount,
  formatSellerEarningsSoldProductDate,
  getSoldProductTitle,
  SELLER_EARNINGS_SOLD_PRODUCT_STATUS,
} from '../../../utils/sellerEarningsDisplay';
import './SellerEarningsStatusProductsModal.css';

export default function SellerEarningsStatusProductsModal({
  open,
  token,
  status,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const title =
    status === SELLER_EARNINGS_SOLD_PRODUCT_STATUS.IN_PROCESS
      ? t('sellerEarnings.statusProductsModal.inProcessTitle')
      : t('sellerEarnings.statusProductsModal.availableTitle');

  useEffect(() => {
    if (!open || !token || !status) {
      setItems([]);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const rows = await fetchAllSellerSoldItemsByStatus(token, status);
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, status, token]);

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      {loading ? (
        <div className="seller-earnings-status-products-modal__loading">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <p className="seller-earnings-status-products-modal__empty">
          {t('sellerEarnings.statusProductsModal.empty')}
        </p>
      ) : (
        <div className="seller-earnings-status-products-modal__list">
          {items.map((item) => {
            const productTitle = getSoldProductTitle(item, i18n.language);
            return (
              <article key={item.id} className="seller-earnings-status-products-modal__item">
                <div className="seller-earnings-status-products-modal__image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={productTitle} />
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="seller-earnings-status-products-modal__content">
                  <strong title={productTitle}>{productTitle}</strong>
                  <p>{item.productCode}</p>
                  <span>{formatSellerEarningsSoldProductDate(item.soldAt)}</span>
                </div>
                <div className="seller-earnings-status-products-modal__price">
                  {formatSellerEarningsAmount(item.price || item.amount)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </GlobalModal>
  );
}
