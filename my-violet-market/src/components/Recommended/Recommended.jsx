import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import { SkeletonPulse } from '../SkeletonLoader';
import { fetchRelatedRecommendations } from '../../api/recommendationApi';
import './Recommended.css';

/** O'xshash mahsulotlar — server algoritmi (productType + productCountry) */
const Recommended = ({ currentProduct, skeleton = false }) => {
  const { i18n } = useTranslation();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (skeleton || !currentProduct?.id) {
      setRecommendedProducts([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    fetchRelatedRecommendations(currentProduct.id)
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
  }, [currentProduct?.id, skeleton]);

  if (!currentProduct) return null;

  if (skeleton || loading) {
    return (
      <div className="recommended-section recommended-section--skeleton" aria-busy="true">
        <SectionTitleWithMore
          title={i18n.t('recommended.title')}
          moreLink=""
          showMore={false}
          className="recommended-section__header"
        />
        <Scrollable type="product" className="recommended-scrollable">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`recommended-sk-${index}`} className="recommended-product-item">
              <SkeletonPulse
                className="product-card product-card--skeleton"
                aria-hidden
              />
            </div>
          ))}
        </Scrollable>
      </div>
    );
  }

  if (recommendedProducts.length === 0) return null;

  return (
    <div className="recommended-section">
      <SectionTitleWithMore
        title={i18n.t('recommended.title')}
        moreLink=""
        showMore={false}
        className="recommended-section__header"
      />
      <Scrollable type="product" className="recommended-scrollable">
        {recommendedProducts.map((product, index) => (
          <div
            key={`recommended-${String(product.id)}-${index}`}
            className="recommended-product-item"
            data-product-id={product.id}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </Scrollable>
    </div>
  );
};

export default Recommended;
