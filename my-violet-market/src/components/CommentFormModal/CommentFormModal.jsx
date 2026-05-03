import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useComments } from '../../contexts/CommentsContext';
import { useToast } from '../../contexts/ToastContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import './CommentFormModal.css';

const LOADER_DURATION_MS = 2000;

const CommentFormModal = ({ isOpen, onClose, onSubmit, productId, productName, productImage }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const displayProductName = typeof productName === 'string' ? productName : getLocalizedText(productName, lang) || '';
  const { addComment } = useComments();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    userName: '',
    rating: 0,
    text: '',
    image: null,
    imagePreview: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

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
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form data when modal closes
      setFormData({
        userName: '',
        rating: 0,
        text: '',
        image: null,
        imagePreview: null,
      });
      setErrors({});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData({
      userName: '',
      rating: 0,
      text: '',
      image: null,
      imagePreview: null,
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating,
    }));
    if (errors.rating) {
      setErrors(prev => ({
        ...prev,
        rating: '',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast('Faqat rasm fayllari qabul qilinadi', 'error');
        return;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Rasm hajmi 5MB dan katta bo\'lmasligi kerak', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if form is valid for enabling submit button (reactive validation)
  const isFormValid = formData.userName.trim() && formData.rating > 0 && formData.text.trim();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userName.trim()) {
      newErrors.userName = i18n.t('commentForm.errorUserName');
    }
    if (formData.rating === 0) {
      newErrors.rating = i18n.t('commentForm.errorRating');
    }
    if (!formData.text.trim()) {
      newErrors.text = i18n.t('commentForm.errorComment');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Final validation before submit
    if (!validateForm()) {
      showToast(i18n.t('commentForm.fillRequired'), 'error');
      return;
    }

    setIsSubmitLoading(true);
    await new Promise((r) => setTimeout(r, LOADER_DURATION_MS));

    // Prepare comment data - ensure productId is string
    // Ensure rating is a valid number (1-5) - use exact value from formData
    const ratingValue = Number(formData.rating);
    const validRating = (ratingValue >= 1 && ratingValue <= 5) ? ratingValue : 1;
    
    const commentData = {
      productId: String(productId),
      userName: formData.userName.trim(),
      rating: validRating,
      text: formData.text.trim(),
      image: formData.imagePreview || null, // Store as base64 for now (in real app, upload to server)
      isTest: true,
    };

    // Add comment
    try {
      addComment(commentData);
      showToast('Izohingiz qo\'shildi!', 'success');
      
      // Reset form immediately to prevent double submission
      setFormData({
        userName: '',
        rating: 0,
        text: '',
        image: null,
        imagePreview: null,
      });
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setIsSubmitLoading(false);
      onClose();
      
      // Call onSubmit callback after modal closes
      if (onSubmit) {
        setTimeout(() => {
          onSubmit();
        }, 200);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Xatolik yuz berdi. Qayta urinib ko\'ring.', 'error');
      setIsSubmitLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const rating = index + 1;
      return (
        <button
          key={index}
          type="button"
          className={`star-btn ${rating <= formData.rating ? 'active' : ''}`}
          onClick={() => handleRatingClick(rating)}
        >
          ⭐
        </button>
      );
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="comment-form-modal-overlay" onClick={handleClose}>
      <div className="comment-form-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="comment-form-modal-close" onClick={handleClose}>
          <i className="bx bx-x"></i>
        </button>

        <div className="comment-form-modal-header">
          <h2 className="comment-form-modal-title">{i18n.t('commentForm.title')}</h2>
          {displayProductName && (
            <div className="comment-form-product-info">
              {productImage && (
                <img
                  src={normalizeImagePath(productImage)}
                  alt={displayProductName}
                  className="comment-form-product-image"
                  onError={(e) => {
                    e.target.src = normalizeImagePath('/img/no-image.png');
                  }}
                />
              )}
              <span className="comment-form-product-name">{displayProductName}</span>
            </div>
          )}
        </div>

        <form 
          className="comment-form" 
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="userName" className="form-label">
              {i18n.t('commentForm.userName')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              className={`form-input ${errors.userName ? 'error' : ''}`}
              value={formData.userName}
              onChange={handleInputChange}
              placeholder={i18n.t('commentForm.userNamePlaceholder')}
            />
            {errors.userName && (
              <span className="error-message">{errors.userName}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              {i18n.t('commentForm.rating')} <span className="required">*</span>
            </label>
            <div className="rating-group">
              {renderStars()}
            </div>
            {errors.rating && (
              <span className="error-message">{errors.rating}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="text" className="form-label">
              {i18n.t('commentForm.comment')} <span className="required">*</span>
            </label>
            <textarea
              id="text"
              name="text"
              className={`form-textarea ${errors.text ? 'error' : ''}`}
              value={formData.text}
              onChange={handleInputChange}
              placeholder={i18n.t('commentForm.commentPlaceholder')}
              rows="5"
            />
            {errors.text && (
              <span className="error-message">{errors.text}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="image" className="form-label">
              {i18n.t('commentForm.imageOptional')}
            </label>
            <div className="image-upload-section">
              <input
                type="file"
                id="image"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              {formData.imagePreview ? (
                <div className="image-preview-wrapper">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </div>
              ) : (
                <label htmlFor="image" className="image-upload-label">
                  <i className="bx bx-image"></i>
                  <span>{i18n.t('commentForm.uploadImage')}</span>
                </label>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`submit-btn ${isSubmitLoading ? 'submit-btn--loading' : ''}`}
              disabled={!isFormValid || isSubmitLoading}
              onClick={(e) => {
                if (!isFormValid) {
                  e.preventDefault();
                  showToast(i18n.t('commentForm.fillRequired'), 'error');
                }
              }}
            >
              <ButtonLoader isLoading={isSubmitLoading}>
                {i18n.t('commentForm.submit')}
              </ButtonLoader>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default CommentFormModal;
