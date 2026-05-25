import React from 'react';
import { SECTION_HOME_DISPLAY_LIMIT } from '../../config/sectionLimits';
import { SkeletonPulse } from '../SkeletonLoader';
import FlashSaleProductCard from './FlashSaleProductCard';
import './FlashSaleSection.css';

const FlashSaleSection = ({ products, isLoading }) => {
  const showSkeleton = isLoading && (!products || products.length === 0);
  const list = Array.isArray(products) ? products : [];

  return (
    <section className="flash-sale-section">
      <div className="flash-sale-grid">
        {showSkeleton
          ? Array.from({ length: SECTION_HOME_DISPLAY_LIMIT }).map((_, i) => (
              <SkeletonPulse
                key={`flash-sale-sk-${i}`}
                className="flash-sale-card flash-sale-card--skeleton"
                aria-hidden
              />
            ))
          : list.slice(0, SECTION_HOME_DISPLAY_LIMIT).map((product) => (
              <FlashSaleProductCard key={`flash-sale-product-${product.id}`} product={product} />
            ))}
      </div>
    </section>
  );
};

export default FlashSaleSection;
