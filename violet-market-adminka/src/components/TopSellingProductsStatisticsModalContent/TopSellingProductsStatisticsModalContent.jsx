import React, { useState } from 'react';
import { useAdminModal } from '../../context/AdminModalContext';
import { useAdminToast } from '../../context/AdminToastContext';
import { buildProductDetailUrl, getLocalizedText } from '../../utils/productDisplay';
import TopSellingProductListItem from '../TopSellingProductListItem/TopSellingProductListItem';
import './TopSellingProductsStatisticsModalContent.css';

export default function TopSellingProductsStatisticsModalContent({
  visible = false,
  periodLabel = '',
  products = [],
}) {
  const { openAdminModal } = useAdminModal();
  const { showSuccess, showError } = useAdminToast();
  const [openMenuProductId, setOpenMenuProductId] = useState(null);

  if (!visible) return null;

  const handleOpenProductSellers = (product) => {
    openAdminModal({
      key: 'product-selling-sellers',
      label: getLocalizedText(product.title),
      productId: product.productId,
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
    <div className="top-selling-products-statistics-modal">
      {periodLabel ? (
        <p className="top-selling-products-statistics-modal__subtitle">
          {periodLabel} davr bo&apos;yicha eng ko&apos;p sotilgan mahsulotlar
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="top-selling-products-statistics-modal__empty">
          Tanlangan davr uchun mahsulot ma&apos;lumoti topilmadi
        </p>
      ) : (
        <div className="top-selling-products-statistics-modal__list">
          {products.map((product) => (
            <TopSellingProductListItem
              key={product.productId}
              product={product}
              isMenuOpen={openMenuProductId === product.productId}
              onMenuToggle={() =>
                setOpenMenuProductId((current) =>
                  current === product.productId ? null : product.productId,
                )
              }
              onMenuClose={() => setOpenMenuProductId(null)}
              onSellerClick={() => handleOpenProductSellers(product)}
              onCopyClick={() => handleCopyProductLink(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
