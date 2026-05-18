import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useSellerSubscriptions } from '../contexts/SellerSubscriptionContext';
import { fetchSellerProfile, fetchSellerProducts } from '../api/sellerApi';
import ProductCard from '../components/ProductCard';
import GlobalMore from '../components/GlobalMore';
import SellerSubscriberCount from '../components/SellerSubscriberCount';
import SellerSubscribeButton from '../components/SellerSubscribeButton';
import LoadMore from '../components/LoadMore';
import {
  SkeletonPulse,
  SellerProfileHeaderSkeleton,
  SellerProfileAboutSkeleton,
  SellerProfileProductsTitleSkeleton,
  SellerProfileProductsGridSkeleton,
} from '../components/SkeletonLoader';
import { LOAD_MORE_INITIAL } from '../config/sectionLimits';
import { normalizeImagePath, getLocalizedText } from '../utils/utils';
import './ProductPage.css';
import './SellerProfile.css';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const { i18n, t } = useTranslation();
  const { authToken } = useUser();
  const { toggleSubscription } = useSellerSubscriptions();
  const lang = (i18n.language || 'uz').split('-')[0] === 'ru' ? 'ru' : 'uz';

  const [seller, setSeller] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!sellerId) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await fetchSellerProfile(sellerId, authToken);
      setSeller(data.seller);
      setProductCount(Number(data.productCount) || 0);
      setSubscriberCount(Number(data.subscriberCount) || 0);
      setSubscribed(Boolean(data.subscribed));
    } catch (err) {
      setSeller(null);
      setProfileError(err?.message || t('seller.notFound'));
    } finally {
      setProfileLoading(false);
    }
  }, [sellerId, authToken, t]);

  const loadProductsPage = useCallback(
    async (pageNum, replace) => {
      if (!sellerId) return;
      setProductsLoading(true);
      try {
        const data = await fetchSellerProducts(
          sellerId,
          { page: pageNum, limit: LOAD_MORE_INITIAL },
          authToken,
        );
        const batch = Array.isArray(data.products) ? data.products : [];
        setProducts((prev) => (replace ? batch : [...prev, ...batch]));
        setPage(pageNum);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        console.error('Sotuvchi mahsulotlari yuklanmadi:', err);
        if (replace) setProducts([]);
        setHasMore(false);
      } finally {
        setProductsLoading(false);
      }
    },
    [sellerId, authToken],
  );

  useEffect(() => {
    setSeller(null);
    setProducts([]);
    setPage(1);
    setHasMore(false);
    setProfileError(null);
    setProfileLoading(true);
    setProductsLoading(true);
    loadProfile();
    loadProductsPage(1, true);
  }, [sellerId, authToken, loadProfile, loadProductsPage]);

  const handleToggleSubscribe = useCallback(async () => {
    const result = await toggleSubscription(sellerId);
    if (result) {
      setSubscribed(Boolean(result.subscribed));
      setSubscriberCount(Number(result.subscriberCount) || 0);
    }
  }, [sellerId, toggleSubscription]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || productsLoading) return;
    loadProductsPage(page + 1, false);
  }, [hasMore, productsLoading, loadProductsPage, page]);

  const showProfileSkeleton = profileLoading;
  const showProductsSkeleton = productsLoading && products.length === 0;
  const showError = !profileLoading && (profileError || !seller);

  if (showError) {
    return (
      <div className="product-page seller-profile-page">
        <div className="container">
          <p className="product-page__empty">{profileError || t('seller.notFound')}</p>
          <Link to="/" className="seller-profile__back-home">
            {t('seller.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  const logoSrc = seller ? normalizeImagePath(seller.logo) : '';

  return (
    <div className="product-page seller-profile-page">
      <div className="container">
        {showProfileSkeleton ? (
          <>
            <SellerProfileHeaderSkeleton />
            <div className="seller-profile__subscribe-mobile seller-profile__subscribe-mobile--skeleton" aria-hidden>
              <SkeletonPulse className="seller-profile__subscribe-btn seller-profile__subscribe-btn--skeleton seller-profile__subscribe-btn--mobile" />
            </div>
            <SellerProfileAboutSkeleton />
          </>
        ) : (
          seller && (
            <>
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
                      {t('seller.productCount', { count: productCount })}
                    </p>
                    <SellerSubscriberCount count={subscriberCount} />
                    <div className="seller-profile__subscribe-inline-desktop">
                      <SellerSubscribeButton subscribed={subscribed} onToggle={handleToggleSubscribe} />
                    </div>
                  </div>
                </div>
              </header>

              <div className="seller-profile__subscribe-mobile">
                <SellerSubscribeButton subscribed={subscribed} onToggle={handleToggleSubscribe} />
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
            </>
          )
        )}

        <section className="seller-profile__products" aria-labelledby="seller-products-heading">
          {showProductsSkeleton ? (
            <>
              <SellerProfileProductsTitleSkeleton />
              <SellerProfileProductsGridSkeleton count={LOAD_MORE_INITIAL} />
            </>
          ) : (
            <>
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
              {hasMore && products.length > 0 && <LoadMore onLoadMore={handleLoadMore} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerProfile;
