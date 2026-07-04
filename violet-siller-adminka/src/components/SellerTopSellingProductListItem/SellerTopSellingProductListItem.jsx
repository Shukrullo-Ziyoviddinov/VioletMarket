import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerRevenue } from '../../utils/sellerSalesDisplay';
import {
  getSellerLocalizedText,
  resolveSellerProductImageUrl,
} from '../../utils/sellerProductDisplay';
import SellerTopSellingProductCopyMenu from '../SellerTopSellingProductCopyMenu/SellerTopSellingProductCopyMenu';

export default function SellerTopSellingProductListItem({
  product,
  isMenuOpen = false,
  onMenuToggle,
  onMenuClose,
  onCopyClick,
}) {
  const { t } = useTranslation();
  const title = getSellerLocalizedText(product.title);

  return (
    <article className="seller-top-selling-products-section__item">
      <span className="seller-top-selling-products-section__rank">{product.rank}</span>
      <img
        className="seller-top-selling-products-section__image"
        src={resolveSellerProductImageUrl(product.image)}
        alt={title}
      />
      <div className="seller-top-selling-products-section__info">
        <h3 className="seller-top-selling-products-section__name">{title}</h3>
        <p className="seller-top-selling-products-section__meta">
          {t('salesStatistics.topProducts.meta', {
            orderCount: product.orderCount,
            quantity: product.totalQuantity,
          })}
        </p>
      </div>
      <div className="seller-top-selling-products-section__amount">
        {formatSellerRevenue(product.totalAmount)}
      </div>
      <SellerTopSellingProductCopyMenu
        isOpen={isMenuOpen}
        onToggle={onMenuToggle}
        onClose={onMenuClose}
        onCopyClick={onCopyClick}
      />
    </article>
  );
}
