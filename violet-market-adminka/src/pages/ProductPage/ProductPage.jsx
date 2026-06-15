import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, EditOutlined, InboxOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchAdminProducts } from '../../api/productsAdminApi';
import ProductSellerSearch, {
  collectSellersFromProducts,
} from '../../components/ProductSellerSearch/ProductSellerSearch';
import { useAdminModal } from '../../context/AdminModalContext';
import {
  formatStatNumber,
  getLocalizedText,
  resolveProductImageUrl,
} from '../../utils/productDisplay';
import './ProductPage.css';

export default function ProductPage() {
  const navigate = useNavigate();
  const { openAdminModal } = useAdminModal();
  const [products, setProducts] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setProducts(rows);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'Mahsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <section className="product-page">
      <div className="product-page__header">
        <div className="product-page__header-main">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="product-page__back"
            onClick={() => navigate('/')}
          >
            Orqaga
          </Button>
          <div className="product-page__heading">
            <h1 className="product-page__title">Mahsulotlar</h1>
            <p className="product-page__subtitle">
              {selectedSellerId
                ? `Ko‘rsatilmoqda: ${formatStatNumber(displayedProducts.length)} ta mahsulot`
                : `Jami: ${formatStatNumber(products.length)} ta mahsulot`}
            </p>
          </div>
        </div>

        <ProductSellerSearch
          sellers={sellers}
          selectedSellerId={selectedSellerId}
          onSellerSelect={setSelectedSellerId}
          onClear={() => setSelectedSellerId(null)}
        />
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
              selectedSellerId
                ? 'Bu sotuvchida mahsulot topilmadi'
                : 'Mahsulotlar topilmadi'
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

            return (
              <article key={product.id} className="product-page-card">
                <div className="product-page-card__media">
                  <img
                    src={imageUrl}
                    alt={title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = resolveProductImageUrl('');
                    }}
                  />
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
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                        className="product-page-card__menu-btn"
                        aria-label="Ko'proq"
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
