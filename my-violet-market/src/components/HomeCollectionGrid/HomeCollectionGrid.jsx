import React from 'react';
import ProductCard from '../ProductCard';
import SectionTitleWithMore from '../SectionTitleWithMore';
import LoadMore from '../LoadMore';
import { SkeletonPulse } from '../SkeletonLoader';
import { usePaginatedCollection } from '../../hooks/usePaginatedCollection';
import { LOAD_MORE_INITIAL, SECTION_HOME_DISPLAY_LIMIT } from '../../config/sectionLimits';

const HomeCollectionGrid = ({
  categoryName,
  title,
  moreLink = '',
  showMore = false,
  className = '',
  skeletonPrefix = 'home-col',
  alwaysShow = false,
}) => {
  const { products, total, hasMore, initialLoading, loadMore } = usePaginatedCollection(categoryName);

  if (!alwaysShow && !initialLoading && total === 0) {
    return null;
  }

  return (
    <div className={className}>
      <SectionTitleWithMore
        title={title}
        moreLink={moreLink}
        showMore={showMore && total > SECTION_HOME_DISPLAY_LIMIT}
      />
      <div className="products-grid">
        {initialLoading
          ? Array.from({ length: LOAD_MORE_INITIAL }).map((_, i) => (
              <SkeletonPulse
                key={`${skeletonPrefix}-sk-${i}`}
                className="product-card product-card--skeleton"
                aria-hidden
              />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
      {hasMore && products.length > 0 && <LoadMore onLoadMore={loadMore} />}
    </div>
  );
};

export default HomeCollectionGrid;
