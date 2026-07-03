import React from 'react';
import { formatRevenue, getLocalizedText, resolveProductImageUrl } from '../../utils/productDisplay';
import TopSellingProductItemActionsMenu from '../TopSellingProductItemActionsMenu/TopSellingProductItemActionsMenu';

export default function TopSellingProductListItem({
  product,
  isMenuOpen = false,
  onMenuToggle,
  onMenuClose,
  onSellerClick,
  onCopyClick,
}) {
  return (
    <article className="top-selling-products-section__item">
      <span className="top-selling-products-section__rank">{product.rank}</span>
      <img
        className="top-selling-products-section__image"
        src={resolveProductImageUrl(product.image)}
        alt={getLocalizedText(product.title)}
      />
      <div className="top-selling-products-section__info">
        <h3 className="top-selling-products-section__name">{getLocalizedText(product.title)}</h3>
        <p className="top-selling-products-section__meta">
          {product.orderCount} ta buyurtma · {product.totalQuantity} ta sotilgan
        </p>
      </div>
      <div className="top-selling-products-section__amount">{formatRevenue(product.totalAmount)}</div>
      <TopSellingProductItemActionsMenu
        isOpen={isMenuOpen}
        onToggle={onMenuToggle}
        onClose={onMenuClose}
        onSellerClick={onSellerClick}
        onCopyClick={onCopyClick}
      />
    </article>
  );
}
