import React, { useRef } from 'react';
import { normalizeImagePath } from '../../utils/utils';
import './CommentCard.css';

const CommentCard = ({ comment, onImageClick, showFullText = false, onCardClick }) => {
  const cardMouseDownRef = useRef(null);
  
  const renderStars = (ratingParam) => {
    // Convert to number and validate
    const numericRating = Number(ratingParam);
    
    // Ensure rating is valid (1-5)
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      // Return empty stars for invalid rating
      return Array.from({ length: 5 }, (_, index) => (
        <i key={index} className="bx bxs-star star empty-star"></i>
      ));
    }
    
    // Use exact rating value (floor to get whole stars)
    const validRating = Math.floor(numericRating);
    
    // Create stars array with boxicons
    return Array.from({ length: 5 }, (_, index) => {
      const isFilled = index < validRating;
      return (
        <i
          key={index}
          className={`bx ${isFilled ? 'bxs-star' : 'bx-star'} star ${isFilled ? 'filled' : 'empty'}`}
        ></i>
      );
    });
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (comment.image && onImageClick) {
      onImageClick(comment.image);
    }
  };

  const handleCardMouseDown = (e) => {
    if (e.target.closest('.comment-image-wrapper') || e.target.classList.contains('comment-image')) {
      e.stopPropagation();
      return;
    }
    cardMouseDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCardClick = (e) => {
    if (e.target.closest('.comment-image-wrapper') || e.target.classList.contains('comment-image')) {
      return;
    }
    
    if (cardMouseDownRef.current) {
      const deltaX = Math.abs(e.clientX - cardMouseDownRef.current.x);
      const deltaY = Math.abs(e.clientY - cardMouseDownRef.current.y);
      
      if (deltaX > 10 || deltaY > 10) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    
    if (onCardClick) {
      setTimeout(() => {
        onCardClick(e);
      }, 200);
    }
  };

  return (
    <div 
      className={`comment-card ${onCardClick ? 'clickable' : ''}`}
      onMouseDown={handleCardMouseDown}
      onClick={handleCardClick}
      onMouseUp={() => {
        setTimeout(() => {
          cardMouseDownRef.current = null;
        }, 250);
      }}
      onMouseLeave={() => {
        cardMouseDownRef.current = null;
      }}
    >
      <div className="comment-card-content">
        <div className="comment-user-name">{comment.userName}</div>
        <div className="comment-rating">
          {renderStars(comment.rating)}
        </div>
        {comment.image && (
          <div className="comment-image-wrapper" onClick={handleImageClick}>
            <img
              src={normalizeImagePath(comment.image)}
              alt="Comment"
              className="comment-image"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleImageClick(e);
              }}
              onError={(e) => {
                e.target.src = normalizeImagePath('/img/no-image.png');
              }}
            />
          </div>
        )}
        <div className={`comment-text ${showFullText ? 'full' : ''}`}>{comment.text}</div>
      </div>
    </div>
  );
};

export default CommentCard;