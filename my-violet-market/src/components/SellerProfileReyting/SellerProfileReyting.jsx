import React from 'react';
import { SkeletonPulse } from '../SkeletonLoader';
import SellerProfileRatingComments from '../SellerProfileRatingComments/SellerProfileRatingComments';
import './SellerProfileReyting.css';

function StarRow({ star, percent }) {
  const filled = '★'.repeat(star);
  const empty = '☆'.repeat(5 - star);
  return (
    <div className="seller-rating__row">
      <div className="seller-rating__stars" aria-hidden>
        <span className="seller-rating__stars-filled">{filled}</span>
        <span className="seller-rating__stars-empty">{empty}</span>
      </div>
      <div className="seller-rating__bar">
        <span
          className="seller-rating__bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, Number(percent) || 0))}%` }}
        />
      </div>
      <div className="seller-rating__percent">{(Number(percent) || 0).toFixed(1)}%</div>
    </div>
  );
}

const SellerProfileReyting = ({ summary, loading, t, locale = 'uz-UZ' }) => {
  const lang = locale.toLowerCase().startsWith('ru') ? 'ru' : 'uz';
  const comments = Array.isArray(summary?.comments) ? summary.comments : [];

  if (loading) {
    return (
      <div className="seller-rating-modal" aria-hidden>
        <div className="seller-rating seller-rating--skeleton">
          <div className="seller-rating__left">
            <SkeletonPulse className="seller-rating__avg-skeleton" />
            <SkeletonPulse className="seller-rating__count-skeleton" />
          </div>
          <div className="seller-rating__right">
            {Array.from({ length: 5 }).map((_, idx) => (
              <SkeletonPulse key={`seller-rating-row-${idx}`} className="seller-rating__row-skeleton" />
            ))}
          </div>
        </div>
        <div className="seller-rating__comments">
          <SellerProfileRatingComments comments={[]} loading t={t} lang={lang} />
        </div>
      </div>
    );
  }

  const averageRating = Number(summary?.averageRating) || 0;
  const totalReviews = Number(summary?.totalReviews) || 0;
  const distribution = Array.isArray(summary?.distribution) ? summary.distribution : [];

  return (
    <div className="seller-rating-modal">
      <div className="seller-rating">
        <div className="seller-rating__left">
          <div className="seller-rating__average">{averageRating.toFixed(1)}</div>
          <div className="seller-rating__count">
            {totalReviews.toLocaleString(locale)} {t('seller.ratingReviews')}
          </div>
        </div>
        <div className="seller-rating__right">
          {[5, 4, 3, 2, 1].map((star) => {
            const row = distribution.find((d) => Number(d.star) === star) || {
              star,
              percent: 0,
            };
            return <StarRow key={`seller-rating-star-${star}`} star={star} percent={row.percent} />;
          })}
        </div>
      </div>
      <div className="seller-rating__comments">
        <SellerProfileRatingComments comments={comments} loading={false} t={t} lang={lang} />
      </div>
    </div>
  );
};

export default SellerProfileReyting;
