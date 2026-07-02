import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../utils/productDisplay';
import TopSellerItemActionsMenu from '../TopSellerItemActionsMenu/TopSellerItemActionsMenu';

export default function TopSellerListItem({
  seller,
  isMenuOpen = false,
  onMenuToggle,
  onMenuClose,
  onInfoClick,
}) {
  return (
    <article className="top-sellers-section__item">
      <span className="top-sellers-section__rank">{seller.rank}</span>
      <img
        className="top-sellers-section__logo"
        src={resolveProductImageUrl(seller.logo)}
        alt={seller.name}
      />
      <div className="top-sellers-section__info">
        <h3 className="top-sellers-section__name">{seller.name}</h3>
        <p className="top-sellers-section__meta">
          {seller.orderCount} ta buyurtma · {seller.totalQuantity} ta mahsulot
        </p>
      </div>
      <div className="top-sellers-section__amount">{formatRevenue(seller.totalAmount)}</div>
      <TopSellerItemActionsMenu
        isOpen={isMenuOpen}
        onToggle={onMenuToggle}
        onClose={onMenuClose}
        onInfoClick={onInfoClick}
      />
    </article>
  );
}
