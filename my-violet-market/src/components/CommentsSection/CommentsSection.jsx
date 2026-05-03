import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useComments } from '../../contexts/CommentsContext';
import { normalizeImagePath } from '../../utils/utils';
import CommentCard from '../CommentCard';
import CommentsModal from '../CommentsModal';
import ImageModal from '../ImageModal';
import './CommentsSection.css';

const CommentsSection = ({ productId }) => {
  const { i18n } = useTranslation();
  const { comments } = useComments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentImages, setCommentImages] = useState([]);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStartPositionRef = useRef(null);
  const hasMovedRef = useRef(false);

  // Ensure productId is string for consistent comparison
  const productIdStr = String(productId);
  // Get comments - filter directly from comments array to ensure reactivity
  const allComments = useMemo(() => {
    return comments.filter(comment => String(comment.productId) === productIdStr);
  }, [productIdStr, comments]);
  
  // Get all comment images for modal
  const allCommentImages = useMemo(() => {
    return allComments
      .filter(comment => comment.image)
      .map(comment => comment.image);
  }, [allComments]);
  
  const displayedComments = allComments.slice(0, 5);
  const hasMoreComments = allComments.length > 5;

  const handleImageClick = (imageSrc) => {
    if (!imageSrc) return;
    
    if (allCommentImages.length === 0) return;
    
    // Find image index - try exact match first
    let imageIndex = allCommentImages.indexOf(imageSrc);
    
    // If not found, try normalized comparison
    if (imageIndex === -1) {
      imageIndex = allCommentImages.findIndex(img => {
        const normalizedImg = normalizeImagePath(img);
        const normalizedSrc = normalizeImagePath(imageSrc);
        return normalizedImg === normalizedSrc || img === imageSrc || img === normalizedSrc;
      });
    }
    
    // Always open modal if we have images, even if exact match not found
    const finalIndex = imageIndex !== -1 ? imageIndex : 0;
    setCurrentImageIndex(finalIndex);
    setCommentImages(allCommentImages);
    setIsImageModalOpen(true);
  };

  // Handle mouse down for drag scrolling
  const handleMouseDown = (e) => {
    // Don't start drag if clicking on image
    const clickedImage = e.target.closest('.comment-image-wrapper');
    if (clickedImage) {
      return;
    }
    
    // Always allow drag scrolling, even on comment cards
    // Store initial position to detect if it's a drag or click
    dragStartPositionRef.current = { x: e.pageX, y: e.pageY };
    setIsDragging(true);
    setHasMoved(false);
    hasMovedRef.current = false;
    const currentX = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    setStartX(currentX);
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grabbing';
    }
  };

  // Handle mouse move for drag scrolling
  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    // Check if user has moved enough to consider it a drag
    if (dragStartPositionRef.current) {
      const deltaX = Math.abs(e.pageX - dragStartPositionRef.current.x);
      const deltaY = Math.abs(e.pageY - dragStartPositionRef.current.y);
      if (deltaX > 5 || deltaY > 5) {
        setHasMoved(true);
        hasMovedRef.current = true;
      }
    }
    
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handle mouse up for drag scrolling
  const handleMouseUp = (e) => {
    const hadMoved = hasMovedRef.current;
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
    
    dragStartPositionRef.current = null;
    
    // Reset hasMoved after a delay to allow click detection
    // Longer delay if drag occurred to prevent modal opening
    setTimeout(() => {
      setHasMoved(false);
      hasMovedRef.current = false;
    }, hadMoved ? 300 : 250);
  };

  // Handle mouse leave for drag scrolling
  const handleMouseLeave = () => {
    const wasDragging = isDragging;
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
    dragStartPositionRef.current = null;
    // If user leaves while dragging, mark as moved to prevent click
    if (wasDragging) {
      setHasMoved(true);
      hasMovedRef.current = true;
    }
  };

  // Touch events for mobile drag/swipe
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle mouse wheel scroll (smooth horizontal scrolling)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || allComments.length === 0) return;

    const handleWheel = (e) => {
      // Scroll horizontally with wheel (Shift key or horizontal scroll)
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        e.stopPropagation();
        const scrollAmount = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [allComments.length]);

  // Initialize cursor style
  useEffect(() => {
    if (scrollContainerRef.current && allComments.length > 0) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  }, [allComments.length]);

  return (
    <>
      {allComments.length > 0 && (
        <div className="comments-section">
          <div className="comments-section-header">
            <h2 className="comments-section-title">{i18n.t('comments.title')}</h2>
            {hasMoreComments && (
              <button
                className="view-more-comments-btn"
                onClick={() => setIsModalOpen(true)}
              >
                {i18n.t('comments.viewMore')}
              </button>
            )}
          </div>
          <div
            ref={scrollContainerRef}
            className="comments-scroll-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="comments-list">
              {displayedComments.map(comment => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  onImageClick={handleImageClick}
                  onCardClick={(e) => {
                    // Only open modal if it was a click (not a drag)
                    // Check hasMovedRef to ensure no drag occurred during the click
                    if (!hasMovedRef.current) {
                      setIsModalOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <CommentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        comments={allComments}
        productId={productId}
      />

      <ImageModal
        images={commentImages}
        initialIndex={currentImageIndex}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
};

export default CommentsSection;
