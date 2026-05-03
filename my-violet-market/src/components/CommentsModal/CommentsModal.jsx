import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { normalizeImagePath } from '../../utils/utils';
import CommentCard from '../CommentCard';
import ImageModal from '../ImageModal';
import './CommentsModal.css';

const CommentsModal = ({ isOpen, onClose, comments, productId }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentImages, setCommentImages] = useState([]);

  // Get all comment images for modal
  const allCommentImages = useMemo(() => {
    return comments
      .filter(comment => comment.image)
      .map(comment => comment.image);
  }, [comments]);

  const handleImageClick = (imageSrc) => {
    if (!imageSrc) return;
    
    // Normalize the image source to match stored format
    const normalizedSrc = imageSrc;
    const imageIndex = allCommentImages.findIndex(img => {
      // Compare both normalized and original formats
      return img === normalizedSrc || img === imageSrc || 
             normalizeImagePath(img) === normalizeImagePath(normalizedSrc);
    });
    
    if (imageIndex !== -1 && allCommentImages.length > 0) {
      setCurrentImageIndex(imageIndex);
      setCommentImages(allCommentImages);
      setIsImageModalOpen(true);
    } else if (allCommentImages.length > 0) {
      // If exact match not found, still open modal with first image
      setCurrentImageIndex(0);
      setCommentImages(allCommentImages);
      setIsImageModalOpen(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="comments-modal-close" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>
        <h2 className="comments-modal-title">Hamma izohlar</h2>
        <div className="comments-modal-list">
          {comments.length === 0 ? (
            <p className="no-comments">Izohlar topilmadi</p>
          ) : (
            comments.map(comment => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                onImageClick={handleImageClick}
                showFullText={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, getPortalContainer())}
      <ImageModal
        images={commentImages}
        initialIndex={currentImageIndex}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
};

export default CommentsModal;
