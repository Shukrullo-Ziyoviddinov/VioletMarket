import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import Scrollable from '../Scrollable';
import { useSearchHistory } from '../../contexts/SearchHistoryContext';
import { allProducts } from '../../data/products';
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

  const recommendedProducts = useMemo(() => {
    if (currentProduct) {
      return getRecommendationsForProductDetail(
        currentProduct,
        recentProductIds || [],
        allProducts,
        limit
      );
    }
    const byHistory = getRecommendationsByViewingHistory(
      recentProductIds || [],
      allProducts,
      limit
    );
    if (byHistory.length > 0) return byHistory;
    return allProducts.slice(0, limit);
  }, [currentProduct, recentProductIds, limit]);

  if (recommendedProducts.length === 0) return null;

  const content = recommendedProducts.map((product) => (
    useScrollable ? (
      <div key={product.id} className="tavsiya-etamiz-product-item" data-product-id={product.id}>
        <ProductCard product={product} />
      </div>
    ) : (
      <ProductCard key={product.id} product={product} />
    )
  ));

  return (
    <section className="tavsiya-etamiz-section">
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
        <div className="tavsiya-etamiz-grid">
          {content}
        </div>
      )}
    </section>
  );
};

export default TavsiyaEtamiz;
