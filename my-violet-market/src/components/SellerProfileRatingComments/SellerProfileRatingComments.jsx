import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonPulse } from '../SkeletonLoader';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../utils/utils';
import './SellerProfileRatingComments.css';

function RatingStars({ rating }) {
  const safe = Math.max(1, Math.min(5, Number(rating) || 0));
  return (
    <div className="seller-rating-comments__stars" aria-hidden>
      {'★'.repeat(safe)}
      <span>{'☆'.repeat(5 - safe)}</span>
    </div>
  );
}

const SellerProfileRatingComments = ({ comments = [], loading, t, lang = 'uz' }) => {
  const navigate = useNavigate();

  const openProductDetail = (comment) => {
    const productId = Number(comment?.product?.id);
    if (!Number.isFinite(productId)) return;
    const selectedProduct = { id: productId, ...comment.product };
    sessionStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
    sessionStorage.setItem('productDetailViewedProducts', JSON.stringify([selectedProduct]));
    navigate('/product-detail');
  };

  if (loading) {
    return (
      <div className="seller-rating-comments" aria-hidden>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div className="seller-rating-comments__card seller-rating-comments__card--skeleton" key={`seller-cm-sk-${idx}`}>
            <div className="seller-rating-comments__product">
              <SkeletonPulse className="seller-rating-comments__img-skeleton" />
              <div className="seller-rating-comments__meta">
                <SkeletonPulse className="seller-rating-comments__title-skeleton" />
                <SkeletonPulse className="seller-rating-comments__price-skeleton" />
                <SkeletonPulse className="seller-rating-comments__stars-skeleton" />
              </div>
            </div>
            <div className="seller-rating-comments__comment">
              <SkeletonPulse className="seller-rating-comments__text-skeleton" />
              <SkeletonPulse className="seller-rating-comments__text-skeleton seller-rating-comments__text-skeleton--short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!comments.length) {
    return <p className="seller-rating-comments__empty">{t('seller.noReviewsYet')}</p>;
  }

  return (
    <div className="seller-rating-comments">
      {comments.map((comment) => {
        const productTitle = getLocalizedText(comment?.product?.title, lang) || t('commentForm.title');
        return (
          <article className="seller-rating-comments__card" key={comment.id}>
            <div
              className="seller-rating-comments__product"
              role="button"
              tabIndex={0}
              onClick={() => openProductDetail(comment)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProductDetail(comment);
                }
              }}
            >
                <img
                  src={normalizeImagePath(comment?.product?.image)}
                  alt={productTitle}
                  className="seller-rating-comments__img"
                />
                <div className="seller-rating-comments__meta">
                  <h4 className="seller-rating-comments__title">{productTitle}</h4>
                  <div className="seller-rating-comments__price">{formatPrice(comment?.product?.price)}</div>
                  <RatingStars rating={comment.rating} />
                </div>
            </div>
            <div className="seller-rating-comments__comment">
              <p className="seller-rating-comments__text">{comment.text}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default SellerProfileRatingComments;
