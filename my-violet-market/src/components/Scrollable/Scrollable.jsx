
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import './Scrollable.css';

const Scrollable = ({ title, items = [], type = 'country', children, className = '' }) => {
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
    
    isMouseDownRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    shouldBlockClickRef.current = false;
    startXRef.current = e.pageX - scrollElement.offsetLeft;
    scrollLeftRef.current = scrollElement.scrollLeft;
    scrollElement.style.scrollBehavior = 'auto';
    scrollElement.classList.add('is-dragging');
    
    e.preventDefault();
  };

  // Mouse move - scroll davomida
  const handleMouseMove = (e) => {
    // Faqat mouse bosilgan bo'lsa ishlaydi
    if (!isMouseDownRef.current || !scrollRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
      shouldBlockClickRef.current = true;
    }
    
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  // Mouse up - scroll tugashi
  const handleMouseUp = (e) => {
    const wasDragging = hasMovedRef.current || shouldBlockClickRef.current;
    isMouseDownRef.current = false;
    
    const currentScroll = scrollRef.current;
    if (currentScroll) {
      currentScroll.style.scrollBehavior = 'smooth';
      currentScroll.classList.remove('is-dragging');
    }
    
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
  }, []);

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
      updateScrollButtons();
    };

    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Touch events (mobil)
  const handleTouchStart = (e) => {
    if (!scrollRef.current) return;
    
    const clickedElement = e.target;
    
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
    const isInteractiveElement = clickedElement.closest && (
      clickedElement.closest('button') || 
      clickedElement.closest('a') ||
      clickedElement.closest('.add-to-cart-btn')
    );
    
    if (isInteractiveElement) {
      hasMovedRef.current = false;
      touchTargetRef.current = clickedElement;
      if (e.cancelable) e.preventDefault();
      return;
    }
    
    isTouchDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    touchDirectionLockedRef.current = null;
    startXRef.current = e.touches[0].pageX;
    startYRef.current = e.touches[0].pageY;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.scrollBehavior = 'auto';
    
    // Bosilgan elementni saqlash (click event uchun)
    touchTargetRef.current = clickedElement;
  };

  const handleTouchMove = (e) => {
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
    
    // Boshqa interaktiv elementlar uchun
    const isInteractiveElement = clickedElement.closest && (
      clickedElement.closest('button') || 
      clickedElement.closest('a') ||
      clickedElement.closest('.add-to-cart-btn')
    );
    
    if (isInteractiveElement) {
      hasMovedRef.current = false;
      if (e.cancelable) e.preventDefault();
      return;
    }
    
    if (!isTouchDraggingRef.current || !scrollRef.current) return;
    
    const deltaX = Math.abs(e.touches[0].pageX - startXRef.current);
    const deltaY = Math.abs(e.touches[0].pageY - startYRef.current);
    
    // Yo'nalishni bir marta aniqlash (10px harakatdan keyin)
    if (!touchDirectionLockedRef.current && (deltaX > 10 || deltaY > 10)) {
      touchDirectionLockedRef.current = deltaX > deltaY ? 'h' : 'v';
    }
    
    // Vertikal harakat – sahifa scroll qilishi uchun preventDefault qilmaymiz
    if (touchDirectionLockedRef.current === 'v') {
      hasMovedRef.current = true; // Click trigger bo'lmasin
      isTouchDraggingRef.current = false;
      return;
    }
    
    // Gorizontal harakat – Scrollable ichida scroll
    const walk = (e.touches[0].pageX - startXRef.current) * 2;
    
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
      if (e.cancelable) e.preventDefault();
    }
    
    if (hasMovedRef.current) {
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleTouchEnd = (e) => {
    const wasDragging = hasMovedRef.current;
    const touchedElement = touchTargetRef.current;
    
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
    
    isTouchDraggingRef.current = false;
    touchDirectionLockedRef.current = null;
    setIsDragging(false);
    
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
      const buttonEl = touchedElement.closest && touchedElement.closest('button');
      const linkEl = touchedElement.closest && touchedElement.closest('a');
      const addToCartEl = touchedElement.closest && touchedElement.closest('.add-to-cart-btn');
      const isInteractiveElement = buttonEl || linkEl || addToCartEl;
      // Button yoki link elementiga dispatch qilamiz (child emas) - loading paytida child o'zgarishi removeChild xatoligiga olib keladi
      const targetEl = addToCartEl || buttonEl || linkEl || touchedElement;
      
      if (isInteractiveElement) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        
        setTimeout(() => {
          if (targetEl && document.body.contains(targetEl)) {
            try {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              targetEl.dispatchEvent(clickEvent);
            } catch (err) {
              console.error('Error dispatching click event to interactive element:', err);
            }
          }
        }, 10);
        
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
    
    setTimeout(() => {
      hasMovedRef.current = false;
      touchTargetRef.current = null;
    }, 100);
  };

  // Scroll tugmalari
  const scroll = (direction) => {
    if (scrollRef.current) {
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
  if (items.length === 0) return null;

  return (
    <div className="scrollable-section">
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
          {items.map(item => (
            <div 
              key={item.id} 
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
          ))}
        </div>
        {canScrollRight && (
          <button className="scroll-btn next" onClick={() => scroll(1)}>
            <i className="bx bx-chevron-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default Scrollable;
