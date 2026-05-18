import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useComments } from '../../contexts/CommentsContext';
import { normalizeImagePath } from '../../utils/utils';
import CommentCard from '../CommentCard';
import CommentsModal from '../CommentsModal';
import ImageModal from '../ImageModal';
import Scrollable from '../Scrollable';
import './CommentsSection.css';

const CommentsSection = ({ productId }) => {
  const { i18n } = useTranslation();
  const { comments, loadCommentsForProduct } = useComments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentImages, setCommentImages] = useState([]);

  useEffect(() => {
    if (productId != null) {
      loadCommentsForProduct(productId);
    }
  }, [productId, loadCommentsForProduct]);

  const productIdStr = String(productId);
  const allComments = useMemo(() => {
    return comments.filter((comment) => String(comment.productId) === productIdStr);
  }, [productIdStr, comments]);

  const allCommentImages = useMemo(() => {
    return allComments.filter((comment) => comment.image).map((comment) => comment.image);
  }, [allComments]);

  const displayedComments = allComments.slice(0, 5);
  const hasMoreComments = allComments.length > 5;

  const handleImageClick = (imageSrc) => {
    if (!imageSrc || allCommentImages.length === 0) return;

    let imageIndex = allCommentImages.indexOf(imageSrc);
    if (imageIndex === -1) {
      imageIndex = allCommentImages.findIndex((img) => {
        const normalizedImg = normalizeImagePath(img);
        const normalizedSrc = normalizeImagePath(imageSrc);
        return normalizedImg === normalizedSrc || img === imageSrc || img === normalizedSrc;
      });
    }

    setCurrentImageIndex(imageIndex !== -1 ? imageIndex : 0);
    setCommentImages(allCommentImages);
    setIsImageModalOpen(true);
  };

  return (
    <>
      {allComments.length > 0 && (
        <div className="comments-section">
          <div className="comments-section-header">
            <h2 className="comments-section-title">{i18n.t('comments.title')}</h2>
            {hasMoreComments && (
              <button
                type="button"
                className="view-more-comments-btn"
                onClick={() => setIsModalOpen(true)}
              >
                {i18n.t('comments.viewMore')}
              </button>
            )}
          </div>
          <Scrollable type="product" className="comments-scrollable">
            {displayedComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onImageClick={handleImageClick}
                onCardClick={() => setIsModalOpen(true)}
              />
            ))}
          </Scrollable>
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
