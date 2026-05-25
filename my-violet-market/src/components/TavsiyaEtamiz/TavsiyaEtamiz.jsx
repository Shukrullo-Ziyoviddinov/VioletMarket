import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import Scrollable from '../Scrollable';
import { SkeletonPulse } from '../SkeletonLoader';
import { useUser } from '../../contexts/UserContext';
import {
  fetchRecommendationsForProduct,
  fetchRecommendationsByHistory,
} from '../../api/recommendationApi';
import './TavsiyaEtamiz.css';

const SKELETON_COUNT = 8;

/**
 * Tavsiya etamiz — faqat server API (algoritm frontendda yo'q).
 * violet-server: services/tavsiyaEtamiz + viewedAt DB.
 * Search panel: /api/search/recommended (alohida, 12 ta limit).
 */
const TavsiyaEtamiz = ({ currentProduct, useScrollable = false }) => {
  const { i18n } = useTranslation();
  const { authToken } = useUser();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const request = currentProduct?.id
      ? fetchRecommendationsForProduct(currentProduct.id, authToken)
      : fetchRecommendationsByHistory(authToken);

    request
      .then((data) => {
        if (!cancelled) {
          setRecommendedProducts(Array.isArray(data.products) ? data.products : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRecommendedProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentProduct?.id, authToken]);

  const showSkeleton = loading && recommendedProducts.length === 0;
  const showSection = recommendedProducts.length > 0 || showSkeleton;

  if (!showSection) return null;

  const content = showSkeleton
    ? Array.from({ length: SKELETON_COUNT }, (_, i) =>
        useScrollable ? (
          <div key={`tavsiya-sk-${i}`} className="tavsiya-etamiz-product-item">
            <SkeletonPulse className="product-card product-card--skeleton" aria-hidden />
          </div>
        ) : (
          <SkeletonPulse
            key={`tavsiya-sk-${i}`}
            className="product-card product-card--skeleton"
            aria-hidden
          />
        ),
      )
    : recommendedProducts.map((product, index) =>
        useScrollable ? (
          <div
            key={`tavsiya-etamiz-${String(product.id)}-${index}`}
            className="tavsiya-etamiz-product-item"
            data-product-id={product.id}
          >
            <ProductCard product={product} />
          </div>
        ) : (
          <ProductCard key={`tavsiya-etamiz-${String(product.id)}-${index}`} product={product} />
        ),
      );

  return (
    <section className="tavsiya-etamiz-section" aria-busy={showSkeleton ? 'true' : undefined}>
      <SectionTitleWithMore
        title={i18n.t('tavsiyaEtamiz.title')}
        moreLink=""
        showMore={false}
        className="tavsiya-etamiz-section__header"
      />
      {useScrollable ? (
        <Scrollable type="product" className="tavsiya-etamiz-scrollable">
          {content}
        </Scrollable>
      ) : (
        <div className="tavsiya-etamiz-grid">{content}</div>
      )}
    </section>
  );
};

export default TavsiyaEtamiz;
