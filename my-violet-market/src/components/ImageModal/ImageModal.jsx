import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { normalizeImagePath } from '../../utils/utils';
import './ImageModal.css';

const ZOOM_SCALE = 2.5;

const ImageModal = ({ images = [], initialIndex = 0, isOpen, onClose }) => {
  const multi = images.length > 1;
  const [index, setIndex] = useState(initialIndex);
  const [slideDir, setSlideDir] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const imgRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const wasDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragViewportRef = useRef(null);
  const settleTimerRef = useRef(null);
  /** Carousel: viewport o‘lchami (px) — track markazlash */
  const [dragLayout, setDragLayout] = useState({ slideW: 0, gap: 0, baseX: 0 });

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setIsZoomed(false);
      setZoomOrigin({ x: 50, y: 50 });
      setSlideDir(null);
      setDragOffset(0);
      setIsDragging(false);
      setIsSettling(false);
      setIsResetting(false);
      isDraggingRef.current = false;
      wasDragRef.current = false;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragOffset(0);
      setIsDragging(false);
      setIsSettling(false);
      setIsResetting(false);
      isDraggingRef.current = false;
    }
    return () => {
      window.clearTimeout(settleTimerRef.current);
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  const go = useCallback((dir) => {
    window.clearTimeout(settleTimerRef.current);
    setDragOffset(0);
    setIsSettling(false);
    setIsResetting(false);
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

  // ImageBanner bilan bir xil: start → move (offset) → end (threshold + velocity)
  const handleDragStart = (clientX) => {
    if (images.length <= 1 || isZoomed) return;
    window.clearTimeout(settleTimerRef.current);
    wasDragRef.current = false;
    setIsSettling(false);
    setIsResetting(false);
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    dragStartTimeRef.current = Date.now();
  };

  const handleDragMove = (clientX) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = clientX;
    let diff = clientX - startXRef.current;
    const w = dragViewportRef.current?.offsetWidth ?? 0;
    if (w > 0) {
      diff = Math.max(-w, Math.min(w, diff));
    }
    if (Math.abs(diff) > 10) wasDragRef.current = true;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;

    const diff = currentXRef.current - startXRef.current;
    const isClickOnly = Math.abs(diff) < 4 && !wasDragRef.current;

    if (isClickOnly) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setIsSettling(false);
      setIsResetting(false);
      setDragOffset(0);
      return;
    }

    const dragDuration = Date.now() - dragStartTimeRef.current;
    const vw = dragViewportRef.current?.offsetWidth || 400;
    const clamped = Math.max(-vw, Math.min(vw, diff));

    // Kenglik bo‘yicha: surish ko‘rinishi uchun juda past threshold + velocity faqat yetarli masofa bo‘lsa
    const threshold = Math.min(Math.max(vw * 0.22, 60), 150);
    const velocity = Math.abs(clamped) / Math.max(dragDuration, 1);
    const velocitySwipe =
      Math.abs(clamped) > 12 && velocity > 0.45;

    isDraggingRef.current = false;
    setIsDragging(false);
    setIsSettling(true);
    window.clearTimeout(settleTimerRef.current);

    if (Math.abs(clamped) > threshold || velocitySwipe) {
      const dir = clamped > 0 ? -1 : 1;
      setDragOffset(dir > 0 ? -vw : vw);

      settleTimerRef.current = window.setTimeout(() => {
        setIsResetting(true);
        setIsZoomed(false);
        setZoomOrigin({ x: 50, y: 50 });
        setSlideDir(null);
        setAnimKey(k => k + 1);
        setIndex(prev => {
          const n = prev + dir;
          if (n < 0) return images.length - 1;
          if (n >= images.length) return 0;
          return n;
        });
        setDragOffset(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsResetting(false);
            setIsSettling(false);
          });
        });
      }, 260);
    } else {
      setDragOffset(0);
      settleTimerRef.current = window.setTimeout(() => {
        setIsSettling(false);
      }, 260);
    }

    window.setTimeout(() => {
      wasDragRef.current = false;
    }, 320);
  };

  const handleMouseDown = (e) => {
    if (images.length <= 1 || isZoomed) return;
    e.preventDefault();
    handleDragStart(e.pageX);
  };

  const handleTouchStart = (e) => {
    if (images.length <= 1 || isZoomed) return;
    handleDragStart(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onDocMove = (e) => handleDragMove(e.pageX);
    const onDocUp = () => handleDragEnd();

    const onDocTouchMove = (e) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
    };
    const onDocTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', onDocMove);
    document.addEventListener('mouseup', onDocUp);
    document.addEventListener('touchmove', onDocTouchMove, { passive: false });
    document.addEventListener('touchend', onDocTouchEnd);
    document.addEventListener('touchcancel', onDocTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onDocMove);
      document.removeEventListener('mouseup', onDocUp);
      document.removeEventListener('touchmove', onDocTouchMove);
      document.removeEventListener('touchend', onDocTouchEnd);
      document.removeEventListener('touchcancel', onDocTouchEnd);
    };
  }, [isDragging]);

  const measureDragCarousel = useCallback(() => {
    const el = dragViewportRef.current;
    if (!el || !isOpen) return;
    const w = el.offsetWidth;
    if (w <= 0) return;
    // Har bir slayd viewport kengligi = dam olishda faqat markazdagi rasm ko‘rinadi
    const slideW = w;
    const gap = 0;
    const baseX = w / 2 - (slideW + gap + slideW / 2);
    setDragLayout({ slideW, gap, baseX });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!multi || isZoomed || !isOpen) return;
    measureDragCarousel();
  }, [multi, isZoomed, isOpen, index, animKey, measureDragCarousel]);

  useEffect(() => {
    if (!multi || isZoomed || !isOpen) return;
    const el = dragViewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureDragCarousel());
    ro.observe(el);
    return () => ro.disconnect();
  }, [multi, isZoomed, isOpen, measureDragCarousel]);

  const jumpTo = (i) => {
    if (i === index) return;
    window.clearTimeout(settleTimerRef.current);
    setDragOffset(0);
    setIsSettling(false);
    setIsResetting(false);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setSlideDir(i > index ? 'slide-left' : 'slide-right');
    setAnimKey(k => k + 1);
    setIndex(i);
  };

  const handleImageClick = (e) => {
    if (wasDragRef.current || isSettling || isResetting) return;
    if (isZoomed) {
      setIsZoomed(false);
      setZoomOrigin({ x: 50, y: 50 });
      return;
    }
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: xPercent, y: yPercent });
    setSlideDir(null);
    setIsZoomed(true);
  };

  const onImgError = (e) => {
    e.target.src = normalizeImagePath('/img/no-image.png');
  };

  if (!isOpen || images.length === 0) return null;

  const src = normalizeImagePath(images[index]);
  const n = images.length;
  const prevIdx = (index - 1 + n) % n;
  const nextIdx = (index + 1) % n;
  const prevSrc = normalizeImagePath(images[prevIdx]);
  const nextSrc = normalizeImagePath(images[nextIdx]);

  // Rasm zoom + (bitta rasm yoki zoom) uchun surish
  const imgStyle = {
    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
    transition:
      isDragging && !isZoomed ? 'none' : 'transform 0.15s ease, border-radius 0.25s',
    transform: isZoomed
      ? `scale(${ZOOM_SCALE})`
      : `translateX(${dragOffset}px) scale(1)`,
  };

  const wrapSlideClass =
    (!multi || isZoomed) && slideDir ? slideDir : '';

  const trackStyle = {
    transform: `translateX(${(dragLayout.slideW ? dragLayout.baseX : 0) + dragOffset}px)`,
    gap: dragLayout.slideW ? `${dragLayout.gap}px` : undefined,
    transition: isDragging || isResetting
      ? 'none'
      : 'transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)',
  };

  const slideFrameStyle = dragLayout.slideW
    ? { flex: `0 0 ${dragLayout.slideW}px`, width: dragLayout.slideW, minWidth: dragLayout.slideW }
    : { flex: '0 0 100%', width: '100%', minWidth: '100%' };

  return createPortal(
    <div
      className={'im-overlay' + (multi ? ' im-multi' : '')}
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
        <div
          key={animKey}
          className={
            'im-img-wrap ' +
            wrapSlideClass +
            (isDragging && !isZoomed ? ' is-img-dragging' : '') +
            (isSettling && !isZoomed ? ' is-img-settling' : '') +
            (isResetting && !isZoomed ? ' is-img-resetting' : '') +
            (multi && !isZoomed ? ' im-img-wrap--carousel' : '')
          }
        >
          {!multi || isZoomed ? (
            <>
              <img
                ref={imgRef}
                src={src}
                alt={'Rasm ' + (index + 1)}
                className={
                  'im-image main-image' + (isZoomed ? ' is-zoomed' : '')
                }
                style={imgStyle}
                onClick={handleImageClick}
                onError={onImgError}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                draggable={false}
              />
              {!isZoomed && (
                <span className="im-zoom-hint">🔍 Kattalashtirish uchun bosing</span>
              )}
            </>
          ) : (
            <div
              ref={dragViewportRef}
              className="im-drag-viewport"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="im-drag-track" style={trackStyle}>
                <div
                  className="im-slide im-slide-side"
                  style={slideFrameStyle}
                  aria-hidden="true"
                >
                  <img
                    src={prevSrc}
                    alt=""
                    className="im-slide-img"
                    draggable={false}
                    onError={onImgError}
                  />
                </div>
                <div
                  className="im-slide im-slide-center"
                  style={slideFrameStyle}
                >
                  <img
                    ref={imgRef}
                    src={src}
                    alt={'Rasm ' + (index + 1)}
                    className="im-image main-image"
                    onClick={handleImageClick}
                    onError={onImgError}
                    draggable={false}
                  />
                </div>
                <div
                  className="im-slide im-slide-side"
                  style={slideFrameStyle}
                  aria-hidden="true"
                >
                  <img
                    src={nextSrc}
                    alt=""
                    className="im-slide-img"
                    draggable={false}
                    onError={onImgError}
                  />
                </div>
              </div>
              <span className="im-zoom-hint">🔍 Kattalashtirish uchun bosing</span>
            </div>
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
