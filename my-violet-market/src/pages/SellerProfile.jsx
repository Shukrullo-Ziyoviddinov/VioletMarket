import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allProducts } from '../data/products';
import { getSellerById } from '../data/sellerData';
import ProductCard from '../components/ProductCard';
import GlobalMore from '../components/GlobalMore';
import SellerSubscriberCount from '../components/SellerSubscriberCount';
import SellerSubscribeButton from '../components/SellerSubscribeButton';
import { useSellerSubscription } from '../hooks/useSellerSubscription';
import { normalizeImagePath, getLocalizedText } from '../utils/utils';
import './ProductPage.css';
import './SellerProfile.css';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const { i18n, t } = useTranslation();
  const lang = (i18n.language || 'uz').split('-')[0] === 'ru' ? 'ru' : 'uz';

  const seller = useMemo(() => getSellerById(sellerId), [sellerId]);

  const products = useMemo(
    () => allProducts.filter((p) => p.sellerId === sellerId),
    [sellerId]
  );

  const baseSubscribers = seller?.subscriberCount ?? 0;
  const { displayCount: subscriberDisplay, subscribed, toggle } = useSellerSubscription(
    sellerId,
    baseSubscribers
  );

  if (!seller) {
    return (
      <div className="product-page seller-profile-page">
        <div className="container">
          <p className="product-page__empty">{t('seller.notFound')}</p>
          <Link to="/" className="seller-profile__back-home">
            {t('seller.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  const logoSrc = normalizeImagePath(seller.logo);

  return (
    <div className="product-page seller-profile-page">
      <div className="container">
        <header className="seller-profile__header">
          <div className="seller-profile__avatar-wrap">
            <img
              src={logoSrc}
              alt=""
              className="seller-profile__avatar"
              onError={(e) => {
                e.target.src = normalizeImagePath('/img/no-image.png');
              }}
            />
          </div>
          <div className="seller-profile__meta">
            <h1 className="seller-profile__name">{getLocalizedText(seller.name, lang)}</h1>
            <div className="seller-profile__stats-row">
              <p className="seller-profile__product-count">
                {t('seller.productCount', { count: products.length })}
              </p>
              <SellerSubscriberCount count={subscriberDisplay} />
              <div className="seller-profile__subscribe-inline-desktop">
                <SellerSubscribeButton subscribed={subscribed} onToggle={toggle} />
              </div>
            </div>
          </div>
        </header>

        <div className="seller-profile__subscribe-mobile">
          <SellerSubscribeButton subscribed={subscribed} onToggle={toggle} />
        </div>

        <section className="seller-profile__about" aria-labelledby="seller-about-heading">
          <h2 id="seller-about-heading" className="seller-profile__section-title">
            {t('seller.aboutTitle')}
          </h2>
          <GlobalMore
            text={getLocalizedText(seller.description, lang)}
            modalTitle={t('seller.aboutTitle')}
            className="seller-profile__description"
            lineClamp={1}
          />
        </section>

        <section className="seller-profile__products" aria-labelledby="seller-products-heading">
          <h2 id="seller-products-heading" className="seller-profile__section-title">
            {t('seller.productsTitle')}
          </h2>
          {products.length === 0 ? (
            <p className="product-page__empty">{t('seller.noProducts')}</p>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerProfile;
