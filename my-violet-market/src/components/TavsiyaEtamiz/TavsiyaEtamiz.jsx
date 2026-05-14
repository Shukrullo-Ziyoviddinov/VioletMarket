import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import Scrollable from '../Scrollable';
import { SkeletonPulse } from '../SkeletonLoader';
import { useSearchHistory } from '../../contexts/SearchHistoryContext';
import { useAppData } from '../../contexts/AppDataContext';
import { getRecommendationsForProductDetail, getRecommendationsByViewingHistory } from '../../services/recommendationService';
import './TavsiyaEtamiz.css';

/**
 * Tavsiya etamiz – Product detail, Wishlist, Profile, Cart sahifalarida.
 * @param {Object} [currentProduct] - Joriy mahsulot (ProductDetail uchun). Bo'lmasa ko'rilganlar bo'yicha tavsiya.
 * @param {boolean} [useScrollable] - true bo'lsa Scrollable (gorizontal), false bo'lsa oddiy grid.
 * @param {number} [limit] - Maksimal mahsulotlar soni.
 */
const TavsiyaEtamiz = ({ currentProduct, useScrollable = false, limit = 12 }) => {
  const { i18n } = useTranslation();
  const { recentProductIds } = useSearchHistory();
  const { allProducts, loading, error } = useAppData();
  const catalog = allProducts || [];
  const appLoading = loading && !error;

  const recommendedProducts = useMemo(() => {
    if (currentProduct) {
      return getRecommendationsForProductDetail(
        currentProduct,
        recentProductIds || [],
        catalog,
        limit
      );
    }
    const byHistory = getRecommendationsByViewingHistory(
      recentProductIds || [],
      catalog,
      limit
    );
    if (byHistory.length > 0) return byHistory;
    return catalog.slice(0, limit);
  }, [currentProduct, recentProductIds, limit, catalog]);

  const showSkeleton = appLoading && recommendedProducts.length === 0;
  const showSection = recommendedProducts.length > 0 || showSkeleton;

  if (!showSection) return null;

  const content = showSkeleton
    ? Array.from({ length: limit }, (_, i) =>
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
        )
      )
    : recommendedProducts.map((product) =>
        useScrollable ? (
          <div key={product.id} className="tavsiya-etamiz-product-item" data-product-id={product.id}>
            <ProductCard product={product} />
          </div>
        ) : (
          <ProductCard key={product.id} product={product} />
        )
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
