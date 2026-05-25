import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useComments } from '../../contexts/CommentsContext';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../utils/utils';
import FlashSaleProgressBar from './FlashSaleProgressBar';
import FlashSaleFooterSignal from './FlashSaleFooterSignal';

const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

const getProgressPercent = (product) => {
  if (product?.quantity != null && Number(product.quantity) > 0) {
    const q = Number(product.quantity);
    return Math.max(12, Math.min(96, 100 - q));
  }
  const idNum = Number(product?.id) || 1;
  return 45 + (idNum % 40);
};

const formatPriceSafe = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return formatPrice(value);
  if (typeof value === 'string') {
    const normalized = value
      .replace(/\s/g, '')
      .replace(/UZS/gi, '')
      .replace(/so'm/gi, '')
      .replace(/\$/g, '')
      .replace(/,/g, '')
      .trim();
    const n = Number(normalized);
    if (Number.isNaN(n)) return value;
    return formatPrice(n);
  }
  return String(value);
};

const FlashSaleProductCard = ({ product }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'uz';
  const { getCommentsByProductId, loadCommentsForProduct } = useComments();

  useEffect(() => {
    if (product?.id != null) {
      loadCommentsForProduct(product.id);
    }
  }, [product?.id, loadCommentsForProduct]);

  const { averageRating, commentCount } = useMemo(() => {
    const productId = String(product?.id);
    const list = getCommentsByProductId(productId);
    const count = list.length;
    const valid = list.filter((comment) => {
      const rating = Number(comment.rating);
      return !Number.isNaN(rating) && rating >= 1 && rating <= 5;
    });
    if (count === 0 || valid.length === 0) {
      return { averageRating: 5, commentCount: count };
    }
    const sum = valid.reduce((acc, comment) => acc + Number(comment.rating), 0);
    const avg = sum / valid.length;
    return {
      averageRating: Math.min(5, Math.max(1, Math.round(avg * 10) / 10)),
      commentCount: count,
    };
  }, [product?.id, getCommentsByProductId]);

  const image =
    product?.colors?.[0]?.mainImage ||
    product?.mainImage ||
    product?.descriptionImages?.[0] ||
    '/img/no-image.png';
  const title = getLocalizedText(product?.title, lang) || '';
  const price = product?.colors?.[0]?.price || product?.price || '';
  const originalPrice =
    product?.colors?.[0]?.originalPrice || product?.originalPrice || '';
  const percent = product?.flashSaleMeta?.soldPercent ?? getProgressPercent(product);
  const signals = Array.isArray(product?.flashSaleMeta?.signals) ? product.flashSaleMeta.signals : [];
  const shouldRotate = Boolean(product?.flashSaleMeta?.rotateSignals) && signals.length > 1;
  const rotateEveryMs = Math.max(1000, Number(product?.flashSaleMeta?.rotateEveryMs) || 5000);
  const [signalIndex, setSignalIndex] = useState(0);

  useEffect(() => {
    setSignalIndex(0);
  }, [product?.id, signals.length, shouldRotate]);

  useEffect(() => {
    if (!shouldRotate) return undefined;
    const timer = window.setInterval(() => {
      setSignalIndex((prev) => (prev + 1) % signals.length);
    }, rotateEveryMs);
    return () => window.clearInterval(timer);
  }, [rotateEveryMs, shouldRotate, signals.length]);

  const activeSignal = signals[signalIndex] || null;
  const progressTone = activeSignal?.tone || product?.flashSaleMeta?.tone || 'normal';
  const discountToneClass =
    progressTone === 'danger'
      ? 'flash-sale-card__discount--danger'
      : progressTone === 'warning'
        ? 'flash-sale-card__discount--warning'
        : progressTone === 'info'
          ? 'flash-sale-card__discount--info'
          : 'flash-sale-card__discount--normal';
  const soldText = `${Math.round(percent)}% ${i18n.t('home.flashSaleSold')}`;
  const openProductDetail = () => {
    if (!product) return;

    sessionStorage.setItem('selectedProduct', JSON.stringify(product));

    if (window.location.pathname === '/product-detail') {
      window.dispatchEvent(new Event('productStorageChange'));
      return;
    }

    sessionStorage.setItem(PRODUCT_DETAIL_HISTORY_KEY, JSON.stringify([product]));
    navigate('/product-detail');
  };

  return (
    <article
      className="flash-sale-card"
      onClick={openProductDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProductDetail();
        }
      }}
    >
      <div className="flash-sale-card__image-wrap">
        <img
          src={normalizeImagePath(image)}
          alt={title}
          className="flash-sale-card__image"
          onError={(e) => {
            e.currentTarget.src = normalizeImagePath('/img/no-image.png');
          }}
        />
      </div>
      <h4 className="flash-sale-card__title">{title}</h4>
      <div className="flash-sale-card__prices">
        <span className="flash-sale-card__price">{formatPriceSafe(price)}</span>
        {originalPrice ? (
          <span className="flash-sale-card__original">{formatPriceSafe(originalPrice)}</span>
        ) : null}
      </div>
      <div className="product-rating-comments">
        <div className="rating-display">
          <span className="star-icon">⭐</span>
          <span className="rating-value">{averageRating}</span>
        </div>
        <div className="comments-display">
          <i className="bx bxs-message-rounded" />
          <span className="comments-count">
            {commentCount} {i18n.t('productCard.commentsCount')}
          </span>
        </div>
      </div>
      <div className="flash-sale-card__footer">
        <p className={`flash-sale-card__discount ${discountToneClass}`}>{soldText}</p>
        <FlashSaleProgressBar percent={percent} tone={progressTone} />
      </div>
      <FlashSaleFooterSignal activeSignal={activeSignal} />
    </article>
  );
};

export default FlashSaleProductCard;
