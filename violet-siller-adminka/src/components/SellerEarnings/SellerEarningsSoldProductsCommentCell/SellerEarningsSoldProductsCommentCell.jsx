import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerEarningsSoldProductsCommentCell.css';

export default function SellerEarningsSoldProductsCommentCell({ comment, onView }) {
  const { t } = useTranslation();

  if (!comment) {
    return <span className="seller-earnings-sold-products-comment-cell__empty">—</span>;
  }

  return (
    <button
      type="button"
      className="seller-earnings-sold-products-comment-cell__btn"
      onClick={() => onView?.(comment)}
    >
      {t('sellerEarnings.soldProducts.comment.view')}
    </button>
  );
}
