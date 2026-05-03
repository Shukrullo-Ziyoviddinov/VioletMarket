import React from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import { allProducts } from '../../data/products';
import './Recommended.css';

/** O'xshash mahsulotlar – barcha bo'limlardan (products, newCollection, womensCollection, mensCollection, trendingItems, engArzonlare) allProducts orqali */
const Recommended = ({ currentProduct }) => {
  const { i18n } = useTranslation();

  if (!currentProduct) return null;

  const currentProductType = currentProduct.productType;
  const currentProductCountry = currentProduct.productCountry;

  if (!currentProductType || !currentProductCountry) return null;

  const recommendedProducts = allProducts
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
