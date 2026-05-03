import React, { useRef, useState, useCallback } from 'react';
import './DragScroll.css';

/**
 * Gorizontal scroll: sichqoncha yoki barmoq bilan ushlab surilganda scroll.
 * Scrollbar yashirin; drag paytida event bubbling to'xtatiladi (modallar ochilmaydi/yopilmaydi).
 */
const DRAG_THRESHOLD = 8;
const TOUCH_DRAG_THRESHOLD = 15;

const DragScroll = ({ children, className = '', direction = 'horizontal', sensitivity = 1.8, usePointerCapture = true, ...props }) => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const pointerDownTargetRef = useRef(null);

  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = useCallback(
    (e) => {
      if (!scrollRef.current) return;
      if (e.target.tagName === 'IMG') e.preventDefault();
      pointerDownTargetRef.current = e.target;
      const el = scrollRef.current;
      if (usePointerCapture) el.setPointerCapture(e.pointerId);
      startXRef.current = isHorizontal ? e.clientX : e.clientY;
      scrollLeftRef.current = isHorizontal ? el.scrollLeft : el.scrollTop;
      hasMovedRef.current = false;
      isDraggingRef.current = true;
      setIsDragging(true);
      el.style.cursor = 'grabbing';
      el.style.scrollBehavior = 'auto';
    },
    [isHorizontal, usePointerCapture]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingRef.current || !scrollRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const el = scrollRef.current;
      const current = isHorizontal ? e.clientX : e.clientY;
      const diff = (current - startXRef.current) * sensitivity;
      if (Math.abs(diff) > DRAG_THRESHOLD) hasMovedRef.current = true;
      if (isHorizontal) {
        el.scrollLeft = scrollLeftRef.current - diff;
      } else {
        el.scrollTop = scrollLeftRef.current - diff;
      }
    },
    [isHorizontal, sensitivity]
  );

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const wasClick = !hasMovedRef.current;
    const clickTarget = pointerDownTargetRef.current;
    if (scrollRef.current) {
      if (usePointerCapture) {
        try {
          scrollRef.current.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setTimeout(() => { hasMovedRef.current = false; }, 150);
    if (usePointerCapture && wasClick && clickTarget && scrollRef.current?.contains(clickTarget)) {
      clickTarget.click();
    }
  }, [usePointerCapture]);

  const handleTouchStart = useCallback(
    (e) => {
      if (!scrollRef.current || !e.touches[0]) return;
      pointerDownTargetRef.current = e.target;
      const el = scrollRef.current;
      startXRef.current = isHorizontal ? e.touches[0].clientX : e.touches[0].clientY;
      scrollLeftRef.current = isHorizontal ? el.scrollLeft : el.scrollTop;
      hasMovedRef.current = false;
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [isHorizontal]
  );

  const handleTouchEnd = useCallback(() => {
    const wasClick = !hasMovedRef.current;
    const clickTarget = pointerDownTargetRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
    setTimeout(() => { hasMovedRef.current = false; }, 150);
    if (wasClick && clickTarget && scrollRef.current?.contains(clickTarget)) {
      setTimeout(() => {
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        clickTarget.dispatchEvent(ev);
      }, 0);
    }
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (!isDraggingRef.current || !e.touches?.[0]) return;
      const current = isHorizontal ? e.touches[0].clientX : e.touches[0].clientY;
      const diff = (current - startXRef.current) * sensitivity;
      if (Math.abs(diff) > TOUCH_DRAG_THRESHOLD) {
        hasMovedRef.current = true;
        e.preventDefault();
      }
      if (isHorizontal) {
        el.scrollLeft = scrollLeftRef.current - diff;
      } else {
        el.scrollTop = scrollLeftRef.current - diff;
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [isHorizontal, sensitivity]);

  const handleClickCapture = useCallback((e) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`drag-scroll ${isHorizontal ? 'drag-scroll--horizontal' : 'drag-scroll--vertical'} ${className}`}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClickCapture={handleClickCapture}
      {...props}
    >
      {children}
    </div>
  );
};

export default DragScroll;
