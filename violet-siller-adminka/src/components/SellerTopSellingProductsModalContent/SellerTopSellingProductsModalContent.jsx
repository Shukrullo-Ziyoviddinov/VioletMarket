import React, { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { buildSellerProductDetailUrl } from '../../utils/sellerProductDisplay';
import SellerTopSellingProductListItem from '../SellerTopSellingProductListItem/SellerTopSellingProductListItem';
import './SellerTopSellingProductsModalContent.css';

export default function SellerTopSellingProductsModalContent({
  periodLabel = '',
  products = [],
}) {
  const { t } = useTranslation();
  const [openMenuProductId, setOpenMenuProductId] = useState(null);

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
    <div className="seller-top-selling-products-modal">
      {periodLabel ? (
        <p className="seller-top-selling-products-modal__subtitle">
          {t('salesStatistics.topProducts.modalSubtitle', { period: periodLabel })}
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="seller-top-selling-products-modal__empty">
          {t('salesStatistics.topProducts.empty')}
        </p>
      ) : (
        <div className="seller-top-selling-products-modal__list">
          {products.map((product) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
