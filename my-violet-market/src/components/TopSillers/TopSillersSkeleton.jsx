import React from 'react';
import { SkeletonPulse } from '../SkeletonLoader';
import Scrollable from '../Scrollable/Scrollable';
import './TopSillers.css';

function TopSillersItemSkeleton() {
  return (
    <div className="top-sillers__item-wrap">
      <article className="top-sillers__item top-sillers__item--skeleton" aria-hidden="true">
        <div className="top-sillers__head">
          <SkeletonPulse className="top-sillers__avatar top-sillers__avatar--skeleton" />
          <div className="top-sillers__meta">
            <SkeletonPulse className="top-sillers__name top-sillers__name--skeleton" />
            <div className="top-sillers__stats top-sillers__stats--skeleton">
              <SkeletonPulse className="top-sillers__stats-line top-sillers__stats-line--a" />
              <SkeletonPulse className="top-sillers__stats-line top-sillers__stats-line--b" />
              <SkeletonPulse className="top-sillers__stats-line top-sillers__stats-line--c" />
            </div>
          </div>
        </div>

        <div className="top-sillers__actions">
          <SkeletonPulse className="top-sillers__action-btn top-sillers__action-btn--skeleton" />
          <SkeletonPulse className="top-sillers__action-btn top-sillers__action-btn--skeleton" />
        </div>
      </article>
    </div>
  );
}

export default function TopSillersSkeleton({ count = 4 }) {
  return (
    <Scrollable type="product" className="top-sillers-scrollable top-sillers-scrollable--skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <TopSillersItemSkeleton key={`top-sillers-sk-${index}`} />
      ))}
    </Scrollable>
  );
}
