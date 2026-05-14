import React from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import { SkeletonPulse } from '../SkeletonLoader';
import { useAppData } from '../../contexts/AppDataContext';
import './Recommended.css';

/** O'xshash mahsulotlar – barcha bo'limlardan allProducts orqali */
const Recommended = ({ currentProduct, skeleton = false }) => {
  const { i18n } = useTranslation();
  const { allProducts } = useAppData();
  const catalog = allProducts || [];

  if (!currentProduct) return null;

  if (skeleton) {
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

  const currentProductType = currentProduct.productType;
  const currentProductCountry = currentProduct.productCountry;

  if (!currentProductType || !currentProductCountry) return null;

  const recommendedProducts = catalog
    .filter(product => {
      if (product.id === currentProduct.id) return false;
      return (
        product.productType === currentProductType &&
        product.productCountry === currentProductCountry
      );
    })
    .slice(0, 8);

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
        {recommendedProducts.map(product => (
          <div 
            key={product.id} 
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
