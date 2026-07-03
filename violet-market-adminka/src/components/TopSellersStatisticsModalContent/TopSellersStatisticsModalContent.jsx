import React, { useState } from 'react';
import { useAdminModal } from '../../context/AdminModalContext';
import TopSellerListItem from '../TopSellerListItem/TopSellerListItem';
import './TopSellersStatisticsModalContent.css';

export default function TopSellersStatisticsModalContent({
  visible = false,
  periodLabel = '',
  sellers = [],
}) {
  const { openAdminModal } = useAdminModal();
  const [openMenuSellerId, setOpenMenuSellerId] = useState(null);

  if (!visible) return null;

  const handleOpenSellerInfo = (seller) => {
    openAdminModal({
      key: 'seller-sold-products',
      label: seller.name,
      sellerId: seller.sellerId,
    });
  };

  return (
    <div className="top-sellers-statistics-modal">
      {periodLabel ? (
        <p className="top-sellers-statistics-modal__subtitle">
          {periodLabel} davr bo&apos;yicha eng yuqori savdo qilgan sotuvchilar
        </p>
      ) : null}

      {sellers.length === 0 ? (
        <p className="top-sellers-statistics-modal__empty">
          Tanlangan davr uchun sotuvchi ma&apos;lumoti topilmadi
        </p>
      ) : (
        <div className="top-sellers-statistics-modal__list">
          {sellers.map((seller) => (
            <TopSellerListItem
              key={seller.sellerId}
              seller={seller}
              isMenuOpen={openMenuSellerId === seller.sellerId}
              onMenuToggle={() =>
                setOpenMenuSellerId((current) =>
                  current === seller.sellerId ? null : seller.sellerId,
                )
              }
              onMenuClose={() => setOpenMenuSellerId(null)}
              onInfoClick={() => handleOpenSellerInfo(seller)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
