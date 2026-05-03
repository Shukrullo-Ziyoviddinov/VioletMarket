import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { normalizeImagePath } from '../../utils/utils';
import './ImageModal.css';

const ZOOM_SCALE = 2.5;

const ImageModal = ({ images = [], initialIndex = 0, isOpen, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const [slideDir, setSlideDir] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imgRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setIsZoomed(false);
      setZoomOrigin({ x: 50, y: 50 });
      setSlideDir(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialIndex]);

  const go = useCallback((dir) => {
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setSlideDir(dir > 0 ? 'slide-left' : 'slide-right');
    setAnimKey(k => k + 1);
    setIndex(prev => {
      const n = prev + dir;
      if (n < 0) return images.length - 1;
      if (n >= images.length) return 0;
      return n;
    });
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isZoomed) { setIsZoomed(false); return; }
        onClose();
      }
      if (!isZoomed && e.key === 'ArrowLeft') go(-1);
      if (!isZoomed && e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, go, onClose, isZoomed]);

  const onTouchStart = (e) => {
    if (isZoomed) return;
    const target = e.target;
    if (target.classList.contains('im-image')) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (isZoomed || touchStartX.current === null) return;
    const target = e.target;
    if (target.classList.contains('im-image')) {
      const diffX = Math.abs(touchStartX.current - e.touches[0].clientX);
      const diffY = Math.abs(touchStartY.current - e.touches[0].clientY);
      if (diffX > 10 || diffY > 10) {
        isDragging.current = true;
      }
    }
  };

  const onTouchEnd = (e) => {
    if (isZoomed || touchStartX.current === null) return;
    const target = e.target;
    if (target.classList.contains('im-image') && isDragging.current) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const jumpTo = (i) => {
    if (i === index) return;
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setSlideDir(i > index ? 'slide-left' : 'slide-right');
    setAnimKey(k => k + 1);
    setIndex(i);
  };

  const handleImageClick = (e) => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomOrigin({ x: 50, y: 50 });
      return;
    }
    const rect = imgRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: xPercent, y: yPercent });
    setIsZoomed(true);
  };

  const onImgError = (e) => {
    e.target.src = normalizeImagePath('/img/no-image.png');
  };

  if (!isOpen || images.length === 0) return null;

  const multi = images.length > 1;
  const src = normalizeImagePath(images[index]);

  // Rasm zoom origin va scale — width/height CSS dan boshqariladi
  const imgStyle = {
    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
    transform: isZoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
  };

  return createPortal(
    <div
      className="im-overlay"
      onClick={isZoomed ? () => { setIsZoomed(false); setZoomOrigin({ x: 50, y: 50 }); } : onClose}
    >
      {/* ---- HEADER ---- */}
      <div className="im-header" onClick={e => e.stopPropagation()}>
        <span className="im-counter">
          {multi ? `${index + 1} / ${images.length}` : ''}
        </span>
        <div className="im-header-actions">
          <button
            className="im-icon-btn"
            title="Yuklab olish"
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = src;
              link.download = '';
              link.click();
            }}
          >
            <i className="bx bx-download"></i>
          </button>
          <button
            className="im-icon-btn"
            onClick={onClose}
            title="Yopish (Esc)"
          >
            <i className="bx bx-x"></i>
          </button>
        </div>
      </div>

      {/* ---- STAGE (rasm maydon) ---- */}
      <div className="im-stage" onClick={e => e.stopPropagation()}>
        <div key={animKey} className={'im-img-wrap ' + (slideDir || '')}>
          <img
            ref={imgRef}
            src={src}
            alt={'Rasm ' + (index + 1)}
            className={'im-image' + (isZoomed ? ' is-zoomed' : '')}
            style={imgStyle}
            onClick={handleImageClick}
            onError={onImgError}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            draggable={false}
          />
          {!isZoomed && (
            <span className="im-zoom-hint">🔍 Kattalashtirish uchun bosing</span>
          )}
        </div>
      </div>

      {/* ---- NAV tugmalari ---- */}
      {multi && !isZoomed && (
        <button
          className="im-nav prev"
          onClick={e => { e.stopPropagation(); go(-1); }}
          aria-label="Oldingi rasm"
        >
          &#10094;
        </button>
      )}

      {multi && !isZoomed && (
        <button
          className="im-nav next"
          onClick={e => { e.stopPropagation(); go(1); }}
          aria-label="Keyingi rasm"
        >
          &#10095;
        </button>
      )}

      {/* ---- THUMBS ---- */}
      {multi && !isZoomed && (
        <div className="im-thumbs-wrap" onClick={e => e.stopPropagation()}>
          <div className="im-thumbs">
            {images.map((img, i) => (
              <div
                key={i}
                className={'im-thumb' + (i === index ? ' active' : '')}
                onClick={() => jumpTo(i)}
              >
                <img
                  src={normalizeImagePath(img)}
                  alt={'Thumbnail ' + (i + 1)}
                  onError={onImgError}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,
    getPortalContainer()
  );
};

export default ImageModal;