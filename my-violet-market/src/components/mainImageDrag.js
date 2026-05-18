import { useState, useRef, useCallback, useEffect } from 'react';
import './mainImageDrag.css';

/**
 * Asosiy rasm carousel — sichqoncha va touch drag.
 */
export function useMainImageDrag({
  imageCount = 0,
  disabled = false,
  onPrev,
  onNext,
  resetKey,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isSettlingImage, setIsSettlingImage] = useState(false);
  const [isResettingImage, setIsResettingImage] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const wrapperRef = useRef(null);
  const hasMovedDuringDragRef = useRef(false);
  const settleTimerRef = useRef(null);

  const canDrag = imageCount > 1 && !disabled;

  const handleImageDragStart = useCallback(
    (clientX) => {
      if (!canDrag) return;
      window.clearTimeout(settleTimerRef.current);
      setIsSettlingImage(false);
      setIsResettingImage(false);
      setIsDraggingImage(true);
      startXRef.current = clientX;
      currentXRef.current = clientX;
      dragStartTimeRef.current = Date.now();
      hasMovedDuringDragRef.current = false;
    },
    [canDrag]
  );

  const handleImageDragMove = useCallback(
    (clientX) => {
      if (!isDraggingImage || !canDrag) return;
      currentXRef.current = clientX;
      const diff = clientX - startXRef.current;

      if (Math.abs(diff) > 3) {
        hasMovedDuringDragRef.current = true;
      }

      setDragOffset(diff);
    },
    [isDraggingImage, canDrag]
  );

  const handleImageDragEnd = useCallback(() => {
    if (!isDraggingImage || !canDrag) return;

    const diff = currentXRef.current - startXRef.current;
    const isClickOnly = Math.abs(diff) < 4 && !hasMovedDuringDragRef.current;

    if (isClickOnly) {
      setIsDraggingImage(false);
      setIsSettlingImage(false);
      setIsResettingImage(false);
      setDragOffset(0);
      return;
    }

    const dragDuration = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(diff) / Math.max(dragDuration, 1);
    const wrapperWidth = wrapperRef.current?.clientWidth || 320;

    const threshold = Math.min(Math.max(wrapperWidth * 0.22, 60), 150);
    const velocityThreshold = 0.45;
    const shouldChangeImage =
      Math.abs(diff) > threshold || (Math.abs(diff) > 12 && velocity > velocityThreshold);

    setIsDraggingImage(false);
    setIsSettlingImage(true);
    window.clearTimeout(settleTimerRef.current);

    if (shouldChangeImage) {
      const isMovingToPrev = diff > 0;
      setDragOffset(isMovingToPrev ? wrapperWidth : -wrapperWidth);

      settleTimerRef.current = window.setTimeout(() => {
        setIsResettingImage(true);

        if (isMovingToPrev) {
          onPrev?.();
        } else {
          onNext?.();
        }

        setDragOffset(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsResettingImage(false);
            setIsSettlingImage(false);
          });
        });
      }, 260);
    } else {
      setDragOffset(0);

      settleTimerRef.current = window.setTimeout(() => {
        setIsSettlingImage(false);
      }, 260);
    }

    setTimeout(() => {
      hasMovedDuringDragRef.current = false;
    }, 320);
  }, [isDraggingImage, canDrag, onPrev, onNext]);

  const handleImageMouseDown = useCallback(
    (e) => {
      if (!canDrag) return;
      e.preventDefault();
      handleImageDragStart(e.pageX);
    },
    [canDrag, handleImageDragStart]
  );

  const handleImageTouchStart = useCallback(
    (e) => {
      if (!canDrag) return;
      handleImageDragStart(e.touches[0].clientX);
    },
    [canDrag, handleImageDragStart]
  );

  const handleImageTouchMove = useCallback(
    (e) => {
      if (!canDrag) return;
      handleImageDragMove(e.touches[0].clientX);
    },
    [canDrag, handleImageDragMove]
  );

  const handleImageTouchEnd = useCallback(() => {
    if (!canDrag) return;
    handleImageDragEnd();
  }, [canDrag, handleImageDragEnd]);

  useEffect(() => {
    if (!isDraggingImage) return;

    const handleDocumentMouseMove = (e) => {
      handleImageDragMove(e.pageX);
    };

    const handleDocumentMouseUp = () => {
      handleImageDragEnd();
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDraggingImage, handleImageDragMove, handleImageDragEnd]);

  useEffect(() => {
    if (!isDraggingImage && !isSettlingImage) {
      setDragOffset(0);
    }
  }, [resetKey, isDraggingImage, isSettlingImage]);

  useEffect(() => {
    return () => {
      window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const wrapperClassName = [
    'main-image-wrapper',
    canDrag ? 'main-image-draggable' : '',
    isDraggingImage ? 'is-dragging' : '',
    isSettlingImage ? 'is-settling' : '',
    isResettingImage ? 'is-resetting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClassName = [
    'main-image-container',
    isDraggingImage ? 'is-dragging' : '',
    isSettlingImage ? 'is-settling' : '',
    isResettingImage ? 'is-resetting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerStyle = { '--drag-offset': `${dragOffset}px` };

  const canOpenImageModal = useCallback(
    (hasImages = true) =>
      hasImages &&
      !isDraggingImage &&
      !isSettlingImage &&
      !isResettingImage &&
      !hasMovedDuringDragRef.current &&
      Math.abs(dragOffset) < 3,
    [isDraggingImage, isSettlingImage, isResettingImage, dragOffset]
  );

  return {
    wrapperRef,
    wrapperClassName,
    wrapperHandlers: {
      onMouseDown: handleImageMouseDown,
      onTouchStart: handleImageTouchStart,
      onTouchMove: handleImageTouchMove,
      onTouchEnd: handleImageTouchEnd,
    },
    containerClassName,
    containerStyle,
    isDraggingImage,
    isSettlingImage,
    isResettingImage,
    dragOffset,
    hasMovedDuringDragRef,
    canOpenImageModal,
  };
}
