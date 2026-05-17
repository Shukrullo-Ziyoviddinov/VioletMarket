import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../contexts/WishlistContext';
import { useComments } from '../../contexts/CommentsContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import CartModal from '../CartModal';
import FlashSaleCountdown from '../FlashSaleCountdown/FlashSaleCountdown';
import './ProductCard.css';

const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

const ProductCard = ({ product, onAddToCart, hideAddToCart, flashDurationHours }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getCommentsByProductId, comments } = useComments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const firstColor = product.colors?.[0];
  const imageSrc = firstColor?.mainImage || '/img/no-image.png';
  const price = firstColor?.price || product.price || 'Noma\'lum';
  const originalPrice = firstColor?.originalPrice || product.originalPrice || null;

  // Calculate rating and comment count
  const { averageRating, commentCount } = useMemo(() => {
    const productId = String(product.id);
    const comments = getCommentsByProductId(productId);
    const count = comments.length;
    
    // Filter out invalid ratings (should be 1-5)
    const validComments = comments.filter(comment => {
      const rating = Number(comment.rating);
      return !isNaN(rating) && rating >= 1 && rating <= 5;
    });
    
    // If no comments or no valid ratings, return default rating of 5
    if (count === 0 || validComments.length === 0) {
      return { averageRating: 5, commentCount: count };
    }
    
    // Calculate average rating from all valid comments
    const sum = validComments.reduce((acc, comment) => {
      const rating = Number(comment.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return acc;
      }
      return acc + rating;
    }, 0);
    
    const avg = sum / validComments.length;
    
    // Round to 1 decimal place, ensure it's between 1 and 5
    const finalRating = Math.min(5, Math.max(1, Math.round(avg * 10) / 10));
    
    return {
      averageRating: finalRating,
      commentCount: count
    };
  }, [product.id, comments, getCommentsByProductId]);

  const handleCardClick = () => {
    sessionStorage.setItem('selectedProduct', JSON.stringify(product));
    
    // Agar allaqachon product-detail sahifasida bo'lsak, custom event trigger qilamiz
    if (window.location.pathname === '/product-detail') {
      window.dispatchEvent(new Event('productStorageChange'));
    } else {
      sessionStorage.setItem(PRODUCT_DETAIL_HISTORY_KEY, JSON.stringify([product]));
      navigate('/product-detail');
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isLiked = isInWishlist(product.id);

  return (
    <>
    <div 
      className="product-card" 
      onClick={(e) => {
        // Agar scroll bo'lgan bo'lsa, click event'ni to'xtatish
        const scrollableContainer = e.target.closest('.scrollable-container');
        if (scrollableContainer) {
          const isDragging = scrollableContainer.classList.contains('is-dragging');
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
        handleCardClick();
      }} 
      data-product-id={product.id}
    >
      <div className="img-box">
        <img 
          src={normalizeImagePath(imageSrc)} 
          alt={getLocalizedText(product.title, lang)}
          onError={(e) => {
            e.target.src = normalizeImagePath('/img/no-image.png');
          }}
        />
        <i
          className={`heart-icon ${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}`}
          onClick={handleWishlist}
        ></i>
        {product.labels && product.labels.length > 0 && (
          <div className="product-labels">
            {product.labels.map((label, index) => {
              // Icon'ni parse qilish
              const renderIcon = () => {
                if (!label.icon) return null;
                
                // animated-hourglass uchun
                if (label.icon.includes('animated-hourglass')) {
                  return <span className="animated-hourglass"></span>;
                }
                
                // HTML string uchun dangerouslySetInnerHTML
                return <span dangerouslySetInnerHTML={{ __html: label.icon }} />;
              };

              return (
                <span
                  key={index}
                  className="product-label"
                  style={{ '--label-bg': label.color }}
                >
                  {renderIcon()}
                  {getLocalizedText(label.text, lang)}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <h2 className="product-title">{getLocalizedText(product.title, lang)}</h2>
      <div className="price-box">
        <span className="price">{price}</span>
        {originalPrice && (
          <span className="original-price">{originalPrice}</span>
        )}
      </div>
      <div className="product-rating-comments">
        <div className="rating-display">
          <span className="star-icon">⭐</span>
          <span className="rating-value">{averageRating}</span>
        </div>
        <div className="comments-display">
          <i className="bx bxs-message-rounded"></i>
          <span className="comments-count">{commentCount} {i18n.t('productCard.commentsCount')}</span>
        </div>
      </div>
      {(flashDurationHours != null && flashDurationHours > 0) && (
        <FlashSaleCountdown
          flashDurationHours={flashDurationHours}
          storageKey={String(product.id)}
        />
      )}
      {!hideAddToCart && (
        <button className="add-to-cart-btn" type="button" onClick={handleAddToCart}>
          {i18n.t('productCard.addToCart')}
        </button>
      )}
    </div>
    <CartModal
      product={product}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
};

export default ProductCard;

