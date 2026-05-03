import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import './VideoModal.css';

const VideoModal = ({ videoSrc, isOpen, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      document.body.style.overflow = 'hidden';
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen || !videoSrc) return null;

  const modalContent = (
    <div className="video-modal" onClick={onClose}>
      <div className="video-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>
          <i className='bx bx-x'></i>
        </span>
        <video 
          ref={videoRef}
          className="product-video" 
          controls
          onClick={(e) => e.stopPropagation()}
        >
          <source src={videoSrc} type="video/mp4" />
          Sizning brauzeringiz video formatni qo'llab-quvvatlamaydi.
        </video>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default VideoModal;
