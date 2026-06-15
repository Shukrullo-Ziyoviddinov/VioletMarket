import React, { useEffect, useState } from 'react';
import { ArrowLeftOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchAdminProducts } from '../../api/productsAdminApi';
import {
  formatStatNumber,
  getLocalizedText,
  resolveProductImageUrl,
} from '../../utils/productDisplay';
import './ProductPage.css';

export default function ProductPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const rows = await fetchAdminProducts();
        if (!cancelled) setProducts(rows);
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(err.message || 'Mahsulotlarni yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="product-page">
      <div className="product-page__header">
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
            Jami: {formatStatNumber(products.length)} ta mahsulot
          </p>
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

      {!loading && !error && products.length === 0 ? (
        <div className="product-page__state">
          <Empty description="Mahsulotlar topilmadi" />
        </div>
      ) : null}

      {!loading && !error && products.length > 0 ? (
        <div className="product-page__grid">
          {products.map((product) => {
            const imageUrl = product.imageUrl || resolveProductImageUrl(product.image);
            const title = getLocalizedText(product.title, 'uz');
            const price = product.price || '—';
            const originalPrice = product.originalPrice || '';
            const sellerName = product.seller ? getLocalizedText(product.seller.name, 'uz') : '';
            const sellerLogoUrl = product.seller
              ? product.seller.logoUrl || resolveProductImageUrl(product.seller.logo)
              : '';

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
