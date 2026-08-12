import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ADMIN_TOAST_TEXTS } from '../../components/AdminToast/adminToastTexts';
import { deleteAdminProduct, fetchAdminProducts, setAdminProductClientActive } from '../../api/productsAdminApi';
import ProductCardMenu from '../../components/ProductCardMenu/ProductCardMenu';
import ProductSellerSearch, {
  collectSellersFromProducts,
} from '../../components/ProductSellerSearch/ProductSellerSearch';
import { useAdminModal } from '../../context/AdminModalContext';
import { useAdminToast } from '../../context/AdminToastContext';
import { useMiniGlobalModal } from '../../context/MiniGlobalModalContext';
import { useGlobalLoaderOnInitialLoad } from '../../hooks/useGlobalLoaderOnInitialLoad';
import {
  formatStatNumber,
  getLocalizedText,
  resolveProductImageUrl,
} from '../../utils/productDisplay';
import './ProductPage.css';

const PAGE_META = {
  all: {
    title: 'Mahsulotlar',
    backTo: '/',
    emptyDefault: 'Mahsulotlar topilmadi',
    emptySeller: 'Bu sotuvchida mahsulot topilmadi',
    totalLabel: 'mahsulot',
  },
  paused: {
    title: "Vaqtincha to'xtatilgan mahsulotlar",
    backTo: '/products',
    emptyDefault: "Vaqtincha to'xtatilgan mahsulotlar topilmadi",
    emptySeller: "Bu sotuvchida vaqtincha to'xtatilgan mahsulot yo'q",
    totalLabel: "to'xtatilgan mahsulot",
  },
};

function isPendingApprovalProduct(product) {
  return String(product?.approvalStatus || '').trim().toLowerCase() === 'pending';
}

function filterProductsByMode(products, mode) {
  const rows = Array.isArray(products) ? products : [];

  // Pending — faqat «Mahsulotni tasdiqlash» sahifasida
  const withoutPending = rows.filter((product) => !isPendingApprovalProduct(product));

  if (mode === 'paused') {
    return withoutPending.filter((product) => product.clientActive === false);
  }

  return withoutPending;
}

export default function ProductPage({ mode = 'all' }) {
  const pageMeta = PAGE_META[mode] || PAGE_META.all;
  const navigate = useNavigate();
  const { openAdminModal } = useAdminModal();
  const { openMiniGlobalModal } = useMiniGlobalModal();
  const { showSuccess, showError } = useAdminToast();
  const [products, setProducts] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuProductId, setOpenMenuProductId] = useState(null);
  const [togglingPauseProductId, setTogglingPauseProductId] = useState(null);

  useGlobalLoaderOnInitialLoad(loading, mode);

  const sellers = useMemo(() => collectSellersFromProducts(products), [products]);

  const displayedProducts = useMemo(() => {
    if (!selectedSellerId) return products;
    return products.filter((product) => String(product.sellerId) === String(selectedSellerId));
  }, [products, selectedSellerId]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await fetchAdminProducts();
      setProducts(filterProductsByMode(rows, mode));
      setSelectedSellerId(null);
      setOpenMenuProductId(null);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'Mahsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleEditProduct = (product) => {
    const title = getLocalizedText(product.title, 'uz');
    openAdminModal({
      key: 'product-edit',
      label: title ? `Tahrirlash: ${title}` : `Mahsulot #${product.id}`,
      productId: product.id,
      onRefresh: loadProducts,
    });
  };

  const handleDeleteProduct = (product) => {
    const title = getLocalizedText(product.title, 'uz') || `Mahsulot #${product.id}`;

    openMiniGlobalModal({
      permissionKey: 'deleteProduct',
      itemName: title,
      onConfirm: async () => {
        try {
          await deleteAdminProduct(product.id);
          showSuccess(ADMIN_TOAST_TEXTS.productDeleted);
          setOpenMenuProductId(null);
          await loadProducts();
        } catch (err) {
          showError(err.message || ADMIN_TOAST_TEXTS.productDeleteError);
          throw err;
        }
      },
    });
  };

  const handleToggleProductPause = async (product) => {
    if (isPendingApprovalProduct(product)) {
      showError(
        'Mahsulot hali tasdiqlash kutilmoqda. «Mahsulotni tasdiqlash» sahifasidan o‘tkazing',
      );
      return;
    }

    const nextClientActive = product.clientActive === false;
    setTogglingPauseProductId(product.id);

    try {
      await setAdminProductClientActive(product.id, nextClientActive);
      setProducts((current) => {
        if (mode === 'paused' && nextClientActive) {
          return current.filter((row) => String(row.id) !== String(product.id));
        }

        return current.map((row) =>
          String(row.id) === String(product.id)
            ? { ...row, clientActive: nextClientActive }
            : row,
        );
      });
      showSuccess(
        nextClientActive
          ? ADMIN_TOAST_TEXTS.productActivated
          : ADMIN_TOAST_TEXTS.productPaused,
      );
    } catch (err) {
      showError(err.message || ADMIN_TOAST_TEXTS.productPauseError);
    } finally {
      setTogglingPauseProductId(null);
    }
  };

  return (
    <section className="product-page">
      <div className="product-page__header">
        <div className="product-page__header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="product-page__back"
            onClick={() => navigate(pageMeta.backTo)}
          >
            Orqaga
          </Button>
          <div className="product-page__heading">
            <h1 className="product-page__title">{pageMeta.title}</h1>
            <p className="product-page__subtitle">
              {selectedSellerId
                ? `Ko‘rsatilmoqda: ${formatStatNumber(displayedProducts.length)} ta ${pageMeta.totalLabel}`
                : `Jami: ${formatStatNumber(products.length)} ta ${pageMeta.totalLabel}`}
            </p>
          </div>
        </div>

        <div className="product-page__header-right">
          <ProductSellerSearch
            sellers={sellers}
            selectedSellerId={selectedSellerId}
            onSellerSelect={setSelectedSellerId}
            onClear={() => setSelectedSellerId(null)}
          />
        </div>
      </div>

      {loading ? (
        <div className="product-page__state">
          <Spin size="large" />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="product-page__state product-page__state--error">{error}</div>
      ) : null}

      {!loading && !error && displayedProducts.length === 0 ? (
        <div className="product-page__state">
          <Empty
            description={
              selectedSellerId ? pageMeta.emptySeller : pageMeta.emptyDefault
            }
          />
        </div>
      ) : null}

      {!loading && !error && displayedProducts.length > 0 ? (
        <div className="product-page__grid">
          {displayedProducts.map((product) => {
            const imageUrl = product.imageUrl || resolveProductImageUrl(product.image);
            const title = getLocalizedText(product.title, 'uz');
            const price = product.price || '—';
            const originalPrice = product.originalPrice || '';
            const sellerName = product.seller ? getLocalizedText(product.seller.name, 'uz') : '';
            const sellerLogoUrl = product.seller
              ? product.seller.logoUrl || resolveProductImageUrl(product.seller.logo)
              : '';
            const quantity = Number(product.effectiveQuantity) || 0;
            const isMenuOpen = String(openMenuProductId) === String(product.id);
            const isPendingApproval = isPendingApprovalProduct(product);
            const isClientActive = product.clientActive !== false;
            const isSellerPaused = product.seller?.status === 'paused';
            const pauseDisabled = isSellerPaused || isPendingApproval;

            return (
              <article
                key={product.id}
                className={`product-page-card${isMenuOpen ? ' product-page-card--menu-open' : ''}${
                  !isClientActive && !isPendingApproval ? ' product-page-card--paused' : ''
                }`}
              >
                <div className="product-page-card__media">
                  <img
                    src={imageUrl}
                    alt={title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = resolveProductImageUrl('');
                    }}
                  />
                  {!isClientActive && !isPendingApproval ? (
                    <div className="product-page-card__paused-overlay" aria-hidden="true">
                      <span>Vaqtincha to&apos;xtatilgan</span>
                    </div>
                  ) : null}
                </div>
                <div className="product-page-card__info">
                  <div className="product-page-card__main">
                    <h2 className="product-page-card__title">{title}</h2>
                    <div className="product-page-card__prices">
                      <span className="product-page-card__price">{price}</span>
                      {originalPrice ? (
                        <span className="product-page-card__old-price">{originalPrice}</span>
                      ) : null}
                    </div>
                    <div className="product-page-card__quantity" aria-live="polite">
                      <InboxOutlined aria-hidden="true" />
                      <span>{formatStatNumber(quantity)} dona qoldi</span>
                    </div>
                  </div>

                  <div className="product-page-card__footer">
                    {product.seller ? (
                      <div className="product-page-card__seller">
                        <img
                          className="product-page-card__seller-logo"
                          src={sellerLogoUrl}
                          alt={sellerName}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = resolveProductImageUrl('');
                          }}
                        />
                        <span className="product-page-card__seller-name">{sellerName}</span>
                      </div>
                    ) : null}

                    <div className="product-page-card__actions">
                      <Button
                        type="default"
                        size="small"
                        icon={<EditOutlined />}
                        className="product-page-card__edit-btn"
                        onClick={() => handleEditProduct(product)}
                      >
                        Tahrirlash
                      </Button>
                      <ProductCardMenu
                        isOpen={isMenuOpen}
                        clientActive={isClientActive}
                        pauseDisabled={pauseDisabled}
                        pauseDisabledReason={
                          isPendingApproval
                            ? 'Mahsulot tasdiqlash kutilmoqda — «Mahsulotni tasdiqlash» sahifasidan o‘tkazing'
                            : isSellerPaused
                              ? "Sotuvchi vaqtincha to'xtatilgan — mahsulotni alohida boshqarib bo'lmaydi"
                              : undefined
                        }
                        togglingPause={String(togglingPauseProductId) === String(product.id)}
                        onToggle={() =>
                          setOpenMenuProductId((current) =>
                            String(current) === String(product.id) ? null : product.id,
                          )
                        }
                        onClose={() => setOpenMenuProductId(null)}
                        onEdit={() => handleEditProduct(product)}
                        onDelete={() => handleDeleteProduct(product)}
                        onTogglePause={() => handleToggleProductPause(product)}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
