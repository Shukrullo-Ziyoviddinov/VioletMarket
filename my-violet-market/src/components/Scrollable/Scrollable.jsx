import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { SkeletonPulse } from '../SkeletonLoader';
import './Scrollable.css';

const Scrollable = ({
  title,
  items = [],
  type = 'country',
  children,
  className = '',
  /** API dan ma'lumot kelayotganda davlat/brend qatorlari uchun skeleton */
  isLoading = false,
  /** true: touch bilan gorizontal surish tugma ustidan ham ishlaydi (masalan o'lcham pillari) */
  skipInteractiveTouchHandling = false,
}) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const touchDirectionLockedRef = useRef(null); // 'h' = horizontal, 'v' = vertical
  const isMouseDownRef = useRef(false);
  const isTouchDraggingRef = useRef(false);
  const touchTargetRef = useRef(null);
  const shouldBlockClickRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const velocityRef = useRef(0);
  const velocitySamplesRef = useRef([]);
  const velTrackRef = useRef({ x: 0, t: 0 });
  const horizontalActiveRef = useRef(false);
  const momentumRafRef = useRef(null);
  const isManualScrollingRef = useRef(false);

  const DIRECTION_LOCK_PX = 8;
  const VELOCITY_SAMPLE_MS = 80;

  const stopMomentum = () => {
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  };

  const trackVelocity = (clientX) => {
    const now = performance.now();
    const { x: prevX, t: prevT } = velTrackRef.current;
    if (prevT > 0) {
      const dt = now - prevT;
      if (dt > 0) {
        velocityRef.current = ((clientX - prevX) / dt) * 16.67;
      }
    }
    velTrackRef.current = { x: clientX, t: now };

    velocitySamplesRef.current.push({ x: clientX, t: now });
    velocitySamplesRef.current = velocitySamplesRef.current.filter(
      (sample) => now - sample.t < VELOCITY_SAMPLE_MS
    );
  };

  const getReleaseVelocity = () => {
    const samples = velocitySamplesRef.current;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) {
        return ((last.x - first.x) / dt) * 16.67;
      }
    }
    return velocityRef.current;
  };

  const getMomentumFriction = (velocity) => {
    const speed = Math.abs(velocity);
    if (speed < 1.5) return 0.76;
    if (speed < 5) return 0.86;
    return 0.93;
  };

  const applyMomentum = (rawVelocity) => {
    const el = scrollRef.current;
    if (!el) {
      finishManualScrolling();
      return;
    }

    if (Math.abs(rawVelocity) < 0.05) {
      finishManualScrolling();
      return;
    }

    stopMomentum();
    el.style.scrollBehavior = 'auto';

    let velocity = rawVelocity;

    const step = () => {
      const speed = Math.abs(velocity);
      if (speed < 0.08) {
        momentumRafRef.current = null;
        finishManualScrolling();
        return;
      }

      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft - velocity;

      if (next <= 0) {
        el.scrollLeft = 0;
        momentumRafRef.current = null;
        finishManualScrolling();
        return;
      }
      if (next >= maxScroll) {
        el.scrollLeft = maxScroll;
        momentumRafRef.current = null;
        finishManualScrolling();
        return;
      }

      el.scrollLeft = next;
      velocity *= getMomentumFriction(velocity);
      momentumRafRef.current = requestAnimationFrame(step);
    };

    momentumRafRef.current = requestAnimationFrame(step);
  };

  const activateHorizontalDrag = () => {
    const el = scrollRef.current;
    if (!el || horizontalActiveRef.current) return;
    horizontalActiveRef.current = true;
    isManualScrollingRef.current = true;
    scrollLeftRef.current = el.scrollLeft;
    el.style.scrollBehavior = 'auto';
    el.style.overflowX = 'hidden';
    el.classList.add('is-dragging');
  };

  const deactivateHorizontalDrag = () => {
    const el = scrollRef.current;
    if (el) {
      el.style.overflowX = '';
      el.classList.remove('is-dragging');
    }
    horizontalActiveRef.current = false;
  };

  const finishManualScrolling = () => {
    deactivateHorizontalDrag();
    isManualScrollingRef.current = false;
    updateScrollButtons();
  };

  const applyDragDelta = (deltaX) => {
    const el = scrollRef.current;
    if (!el || deltaX === 0) return;
    el.scrollLeft -= deltaX;
  };

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const currentScrollLeft = el.scrollLeft;
    const threshold = 5;

    setCanScrollLeft(currentScrollLeft > threshold);
    setCanScrollRight(maxScrollLeft - currentScrollLeft > threshold);
  };

  // Mouse down - scroll boshlanishi
  const handleMouseDown = (e) => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    stopMomentum();
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    shouldBlockClickRef.current = false;
    horizontalActiveRef.current = false;
    touchDirectionLockedRef.current = null;
    velocityRef.current = 0;
    velocitySamplesRef.current = [];
    velTrackRef.current = { x: 0, t: 0 };
    lastPointerXRef.current = e.pageX;
    startXRef.current = e.pageX;
    startYRef.current = e.pageY;
    scrollLeftRef.current = scrollElement.scrollLeft;
  };

  // Mouse move - scroll davomida
  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || !scrollRef.current) return;

    const x = e.pageX;
    const y = e.pageY;
    const totalDeltaX = Math.abs(x - startXRef.current);
    const totalDeltaY = Math.abs(y - startYRef.current);

    if (!touchDirectionLockedRef.current) {
      if (totalDeltaX < DIRECTION_LOCK_PX && totalDeltaY < DIRECTION_LOCK_PX) return;
      touchDirectionLockedRef.current = totalDeltaX > totalDeltaY ? 'h' : 'v';
    }

    if (touchDirectionLockedRef.current === 'v') {
      isMouseDownRef.current = false;
      touchDirectionLockedRef.current = null;
      return;
    }

    if (!horizontalActiveRef.current) {
      activateHorizontalDrag();
      setIsDragging(true);
      lastPointerXRef.current = x;
      trackVelocity(x);
      return;
    }

    e.preventDefault();
    const delta = x - lastPointerXRef.current;
    lastPointerXRef.current = x;

    if (totalDeltaX > 3) {
      hasMovedRef.current = true;
      shouldBlockClickRef.current = true;
    }

    trackVelocity(x);
    applyDragDelta(delta);
  };

  // Mouse up - scroll tugashi
  const handleMouseUp = (e) => {
    const wasDragging = hasMovedRef.current || shouldBlockClickRef.current;
    isMouseDownRef.current = false;
    
    const currentScroll = scrollRef.current;
    if (currentScroll) {
      currentScroll.classList.remove('is-dragging');
      if (wasDragging) {
        isManualScrollingRef.current = true;
        applyMomentum(getReleaseVelocity());
      } else {
        deactivateHorizontalDrag();
        isManualScrollingRef.current = false;
      }
    }

    touchDirectionLockedRef.current = null;

    // Agar scroll bo'lgan bo'lsa, click event'ni to'xtatish
    if (wasDragging && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Agar drag bo'lgan bo'lsa, flaglarni biroz uzoqroq saqlash (click event'larni to'xtatish uchun)
    if (wasDragging) {
      // isDragging ni biroz kechiktirib false qilamiz
      setTimeout(() => {
        setIsDragging(false);
      }, 100);
      
      // Flaglarni reset qilish
      setTimeout(() => {
        hasMovedRef.current = false;
        shouldBlockClickRef.current = false;
      }, 300);
    } else {
      // Agar drag bo'lmagan bo'lsa, flaglarni darhol reset qilamiz
      setIsDragging(false);
      hasMovedRef.current = false;
      shouldBlockClickRef.current = false;
    }
  };

  // Document-level event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      stopMomentum();
    };
  }, []);

  // Touch events – passive: false kerak, preventDefault() ishlashi uchun
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const opts = { passive: false };
    el.addEventListener('touchstart', handleTouchStart, opts);
    el.addEventListener('touchmove', handleTouchMove, opts);
    el.addEventListener('touchend', handleTouchEnd, opts);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart, opts);
      el.removeEventListener('touchmove', handleTouchMove, opts);
      el.removeEventListener('touchend', handleTouchEnd, opts);
    };
  }, [skipInteractiveTouchHandling]);

  // Mishka bilan drag qilinganda click bloklash – capture phase (child'dan oldin)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleClickCapture = (e) => {
      if (hasMovedRef.current || shouldBlockClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('click', handleClickCapture, true);
    return () => el.removeEventListener('click', handleClickCapture, true);
  }, []);

  // Scroll bo'lganda va oyna o'lchami o'zgarganda tugmalarni yangilash
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();

    const handleResize = () => {
      updateScrollButtons();
    };

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      updateScrollButtons();
    };

    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [items.length, isLoading, type]);

  // Touch events (mobil)
  const handleTouchStart = (e) => {
    if (!scrollRef.current) return;

    const clickedElement = e.target;

    if (!skipInteractiveTouchHandling) {
    // Yurakcha ikonkasini topish - avval clickedElement o'zini tekshiramiz
    let heartIcon = null;
    if (clickedElement.classList && clickedElement.classList.contains('heart-icon')) {
      heartIcon = clickedElement;
    } else if (clickedElement.closest) {
      heartIcon = clickedElement.closest('.heart-icon');
    }
    
    // Agar yurakcha ikonkasiga bosilgan bo'lsa, scroll'ni to'xtatish
    if (heartIcon) {
      hasMovedRef.current = false;
      touchTargetRef.current = heartIcon;
      if (e.cancelable) e.preventDefault();
      return;
    }
    
    // Boshqa interaktiv elementlar uchun
    const interactiveEl = clickedElement.closest && (
      clickedElement.closest('.add-to-cart-btn') ||
      clickedElement.closest('button') ||
      clickedElement.closest('a')
    );
    
    if (interactiveEl) {
      hasMovedRef.current = false;
      touchTargetRef.current = interactiveEl;
      startXRef.current = e.touches[0].pageX;
      startYRef.current = e.touches[0].pageY;
      // preventDefault qilmaymiz — sahifa scroll ishlashi uchun
      return;
    }
    }

    stopMomentum();
    isTouchDraggingRef.current = true;
    hasMovedRef.current = false;
    horizontalActiveRef.current = false;
    touchDirectionLockedRef.current = null;
    velocityRef.current = 0;
    velocitySamplesRef.current = [];
    velTrackRef.current = { x: 0, t: 0 };
    startXRef.current = e.touches[0].pageX;
    startYRef.current = e.touches[0].pageY;
    lastPointerXRef.current = e.touches[0].pageX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;

    // Bosilgan elementni saqlash (click event uchun)
    touchTargetRef.current = clickedElement;
  };

  const handleTouchMove = (e) => {
    if (!skipInteractiveTouchHandling) {
    // Agar yurakcha ikonkasiga bosilgan bo'lsa, scroll'ni to'xtatish
    const clickedElement = e.target;
    let heartIcon = null;
    if (clickedElement.classList && clickedElement.classList.contains('heart-icon')) {
      heartIcon = clickedElement;
    } else if (clickedElement.closest) {
      heartIcon = clickedElement.closest('.heart-icon');
    }
    
    if (heartIcon) {
      hasMovedRef.current = false;
      if (e.cancelable) e.preventDefault();
      return;
    }
    
    // Interaktiv elementdan boshlangan touch — harakatni kuzatamiz (scroll vs tap)
    const interactiveStartEl = touchTargetRef.current && (
      (touchTargetRef.current.closest && (
        touchTargetRef.current.closest('.add-to-cart-btn') ||
        touchTargetRef.current.closest('button') ||
        touchTargetRef.current.closest('a')
      )) ||
      (touchTargetRef.current.classList && (
        touchTargetRef.current.classList.contains('add-to-cart-btn') ||
        touchTargetRef.current.tagName === 'BUTTON' ||
        touchTargetRef.current.tagName === 'A'
      ))
    );

    if (interactiveStartEl || (clickedElement.closest && (
      clickedElement.closest('button') ||
      clickedElement.closest('a') ||
      clickedElement.closest('.add-to-cart-btn')
    ))) {
      const deltaX = Math.abs(e.touches[0].pageX - startXRef.current);
      const deltaY = Math.abs(e.touches[0].pageY - startYRef.current);
      if (deltaX > DIRECTION_LOCK_PX || deltaY > DIRECTION_LOCK_PX) {
        hasMovedRef.current = true;
      }
      // preventDefault yo'q — scroll davom etsin
      return;
    }
    }

    if (!isTouchDraggingRef.current || !scrollRef.current) return;
    
    const deltaX = Math.abs(e.touches[0].pageX - startXRef.current);
    const deltaY = Math.abs(e.touches[0].pageY - startYRef.current);

    if (!touchDirectionLockedRef.current) {
      if (deltaX < DIRECTION_LOCK_PX && deltaY < DIRECTION_LOCK_PX) return;
      touchDirectionLockedRef.current = deltaX > deltaY ? 'h' : 'v';
    }

    // Vertikal harakat – sahifaga scroll qilish uchun hech narsa bloklanmaydi
    if (touchDirectionLockedRef.current === 'v') {
      if (deltaY >= DIRECTION_LOCK_PX) {
        hasMovedRef.current = true;
      }
      isTouchDraggingRef.current = false;
      touchDirectionLockedRef.current = null;
      return;
    }

    const touchX = e.touches[0].pageX;

    if (!horizontalActiveRef.current) {
      activateHorizontalDrag();
      lastPointerXRef.current = touchX;
      trackVelocity(touchX);
      if (e.cancelable) e.preventDefault();
      return;
    }

    const delta = touchX - lastPointerXRef.current;
    lastPointerXRef.current = touchX;

    if (Math.abs(touchX - startXRef.current) > 3) {
      hasMovedRef.current = true;
      if (e.cancelable) e.preventDefault();
    }

    if (hasMovedRef.current) {
      trackVelocity(touchX);
      applyDragDelta(delta);
    }
  };

  const handleTouchEnd = (e) => {
    const wasDragging = hasMovedRef.current;
    const touchedElement = touchTargetRef.current;

    // Scroll bo'lgan bo'lsa — keyingi native clickni bloklash (add-to-cart modal ochilmasin)
    if (wasDragging) {
      shouldBlockClickRef.current = true;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    
    if (scrollRef.current) {
      scrollRef.current.classList.remove('is-dragging');
      if (wasDragging) {
        isManualScrollingRef.current = true;
        applyMomentum(getReleaseVelocity());
      } else {
        deactivateHorizontalDrag();
        isManualScrollingRef.current = false;
      }
    }

    isTouchDraggingRef.current = false;
    horizontalActiveRef.current = false;
    touchDirectionLockedRef.current = null;
    
    // Agar interaktiv elementga bosilgan bo'lsa (yurakcha, button, va h.k.), to'g'ridan-to'g'ri click event'ni trigger qilish
    if (touchedElement && !wasDragging) {
      // Yurakcha ikonkasini topish - avval touchedElement o'zini tekshiramiz
      let heartIcon = null;
      
      // Agar touchedElement o'zi yurakcha ikonkasiga tegishli bo'lsa
      if (touchedElement.classList && touchedElement.classList.contains('heart-icon')) {
        heartIcon = touchedElement;
      } 
      // Agar touchedElement yurakcha ikonkasining ichida bo'lsa (masalan, <i> tag'i ichidagi element)
      else if (touchedElement.closest) {
        heartIcon = touchedElement.closest('.heart-icon');
      }
      
      if (heartIcon) {
        // Yurakcha ikonkasiga bosilganda, darhol click event'ni trigger qilamiz
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        
        setTimeout(() => {
          if (heartIcon && document.body.contains(heartIcon)) {
            try {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              heartIcon.dispatchEvent(clickEvent);
            } catch (error) {
              console.error('Error dispatching click event to heart icon:', error);
            }
          }
        }, 10);
        
        touchTargetRef.current = null;
        hasMovedRef.current = false;
        return;
      }
      
      // Boshqa interaktiv elementlar uchun (button, link, add-to-cart-btn)
      // touchstart da preventDefault qilinmagan — native click ishlaydi.
      // Scroll bo'lgan bo'lsa clickni bloklaymiz (modal ochilmasin).
      const buttonEl = touchedElement.closest && touchedElement.closest('button');
      const linkEl = touchedElement.closest && touchedElement.closest('a');
      const addToCartEl = touchedElement.closest && touchedElement.closest('.add-to-cart-btn');
      const isInteractiveElement = buttonEl || linkEl || addToCartEl;

      if (isInteractiveElement) {
        touchTargetRef.current = null;
        hasMovedRef.current = false;
        return;
      }
      
      // Mahsulot kartasini topish (yurakcha ikonkasidan tashqari)
      const productCard = touchedElement.closest && touchedElement.closest('.product-card');
      
      if (productCard) {
        // Mahsulot kartasiga bosilganda, darhol click event'ni trigger qilamiz
        setTimeout(() => {
          if (productCard && document.body.contains(productCard)) {
            try {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              productCard.dispatchEvent(clickEvent);
            } catch (error) {
              console.error('Error dispatching click event to product card:', error);
            }
          }
        }, 10);
        
        touchTargetRef.current = null;
        hasMovedRef.current = false;
        return;
      }
    }
    
    // Agar drag bo'lmagan bo'lsa va element topilgan bo'lsa, click event'ni trigger qilish
    // (Bu kod faqat yurakcha ikonkasiga yoki boshqa interaktiv elementga bosilganda ishlamaydi)
    if (!wasDragging && touchedElement) {
      // Mahsulot kartasini topish
      const productCard = touchedElement.closest && touchedElement.closest('.product-card');
      
      if (productCard) {
        // Mahsulot kartasiga bosilganda, darhol click event'ni trigger qilamiz
        setTimeout(() => {
          if (productCard && document.body.contains(productCard)) {
            try {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              productCard.dispatchEvent(clickEvent);
            } catch (error) {
              console.error('Error dispatching click event to product card:', error);
            }
          }
        }, 10);
        
        touchTargetRef.current = null;
        hasMovedRef.current = false;
        return;
      }
      
      // Boshqa elementlar uchun
      setTimeout(() => {
        if (touchedElement && document.body.contains(touchedElement)) {
          try {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            touchedElement.dispatchEvent(clickEvent);
          } catch (error) {
            console.error('Error dispatching click event:', error);
          }
        }
      }, 50);
    }
    
    if (wasDragging) {
      setTimeout(() => {
        hasMovedRef.current = false;
        shouldBlockClickRef.current = false;
        touchTargetRef.current = null;
      }, 300);
    } else {
      setTimeout(() => {
        hasMovedRef.current = false;
        touchTargetRef.current = null;
      }, 100);
    }
  };

  // Scroll tugmalari
  const scroll = (direction) => {
    if (scrollRef.current) {
      stopMomentum();
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.scrollBy({
        left: direction * 300,
        behavior: 'smooth'
      });
      // Scrolldan keyin ham tugmalarni tekshirish
      setTimeout(updateScrollButtons, 100);
    }
  };

  // Item click handler - faqat oddiy click bo'lganda navigate qilamiz
  const handleItemClick = (e, item) => {
    // Agar scroll bo'lgan bo'lsa, sahifaga o'tmasligi uchun
    if (hasMovedRef.current || shouldBlockClickRef.current || isDragging || isMouseDownRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Oddiy click bo'lsa, sahifaga o'tamiz
    e.preventDefault();
    e.stopPropagation();
    navigate(item.link);
  };

  const showCountryBrandSkeleton =
    isLoading && (type === 'country' || type === 'brand') && items.length === 0;
  const skeletonCardCount = type === 'country' ? 6 : 8;

  // Agar children bo'lsa, children'ni render qilamiz
  if (children) {
    return (
      <div className={`scrollable-section ${className}`}>
        <div className="scrollable-wrapper">
          {canScrollLeft && (
            <button className="scroll-btn prev" onClick={() => scroll(-1)}>
              <i className="bx bx-chevron-left"></i>
            </button>
          )}
          <div
            className={`scrollable-container ${type} ${isDragging ? 'is-dragging' : ''}`}
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={(e) => {
              // Agar scroll bo'lgan bo'lsa, click event'ni to'xtatish
              if (hasMovedRef.current || shouldBlockClickRef.current || isDragging) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }}
          >
            {children}
          </div>
          {canScrollRight && (
            <button className="scroll-btn next" onClick={() => scroll(1)}>
              <i className="bx bx-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Agar items bo'lsa, eski funksiyani ishlatamiz
  if (items.length === 0 && !showCountryBrandSkeleton) return null;

  return (
    <div className={`scrollable-section ${className}`.trim()}>
      <div className="scrollable-wrapper">
        {canScrollLeft && (
          <button type="button" className="scroll-btn prev" onClick={() => scroll(-1)}>
            <i className="bx bx-chevron-left"></i>
          </button>
        )}
        <div
          className={`scrollable-container ${type} ${isDragging ? 'is-dragging' : ''}`.trim()}
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          aria-busy={showCountryBrandSkeleton ? 'true' : undefined}
          onClick={(e) => {
            // Agar scroll bo'lgan bo'lsa, click event'ni to'xtatish
            if (hasMovedRef.current || shouldBlockClickRef.current || isDragging) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
        >
          {showCountryBrandSkeleton
            ? Array.from({ length: skeletonCardCount }).map((_, index) =>
                type === 'country' ? (
                  <SkeletonPulse
                    key={`sk-country-${index}`}
                    className="scrollable-item country scrollable-item--skeleton"
                    aria-hidden="true"
                  />
                ) : (
                  <SkeletonPulse
                    key={`sk-brand-${index}`}
                    className="scrollable-item brand scrollable-item--skeleton"
                    aria-hidden="true"
                  />
                )
              )
            : items.map((item, index) => (
              <div
                key={`${type}-${String(item.id)}-${index}`}
                className={`scrollable-item ${type}`}
                onClick={(e) => handleItemClick(e, item)}
              >
                {type === 'country' && (
                  <>
                    <div className="item-image-wrapper">
                      <img
                        src={normalizeImagePath(item.image)}
                        alt={getLocalizedText(item.name, lang)}
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                      <img
                        src={normalizeImagePath(item.flag)}
                        alt={getLocalizedText(item.name, lang)}
                        className="flag-badge"
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                    </div>
                    <div className="item-info">
                      <h3>{getLocalizedText(item.name, lang)}</h3>
                    </div>
                  </>
                )}
                {type === 'brand' && (
                  <img
                    src={normalizeImagePath(item.image)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = normalizeImagePath('/img/no-image.png');
                    }}
                  />
                )}
              </div>
            ))
          }
        </div>
        {canScrollRight && (
          <button type="button" className="scroll-btn next" onClick={() => scroll(1)}>
            <i className="bx bx-chevron-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default Scrollable;
