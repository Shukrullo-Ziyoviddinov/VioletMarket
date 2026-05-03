import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allProducts } from '../../data/products';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import './StylingIdea.css';

const StylingIdea = ({ currentProduct }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const groupsContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const clickStartTimeRef = useRef(0);
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const touchTargetRef = useRef(null);
  const touchProductRef = useRef(null);

  if (!currentProduct?.relatedGroups || currentProduct.relatedGroups.length === 0) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (!groupsContainerRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    clickStartTimeRef.current = Date.now();
    clickStartPosRef.current = { x: e.pageX, y: e.pageY };
    startXRef.current = e.pageX - groupsContainerRef.current.offsetLeft;
    scrollLeftRef.current = groupsContainerRef.current.scrollLeft;
    groupsContainerRef.current.classList.add('is-dragging');
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !groupsContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - groupsContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2.5;
    
    // Agar 5px dan ko'p harakat bo'lsa, drag deb hisoblaymiz
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    
    groupsContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (groupsContainerRef.current) {
      groupsContainerRef.current.classList.remove('is-dragging');
    }
    // Drag holatini bir oz kechiktirib tozalaymiz
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleTouchStart = (e) => {
    if (!groupsContainerRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    clickStartTimeRef.current = Date.now();
    clickStartPosRef.current = { 
      x: e.touches[0].pageX, 
      y: e.touches[0].pageY 
    };
    startXRef.current = e.touches[0].pageX - groupsContainerRef.current.offsetLeft;
    scrollLeftRef.current = groupsContainerRef.current.scrollLeft;
    groupsContainerRef.current.classList.add('is-dragging');
    // Bosilgan elementni va mahsulotni saqlash
    const productElement = e.target.closest('.styling-idea-product');
    touchTargetRef.current = productElement;
    // Mahsulot ma'lumotlarini topish
    if (productElement) {
      const productId = productElement.getAttribute('data-product-id');
      if (productId) {
        const product = allProducts.find(p => String(p.id) === productId);
        touchProductRef.current = product;
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !groupsContainerRef.current) return;
    const x = e.touches[0].pageX - groupsContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2.5;
    
    // Agar 5px dan ko'p harakat bo'lsa, drag deb hisoblaymiz
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
      // Faqat drag bo'lganda preventDefault qilamiz
      e.preventDefault();
    }
    
    // Faqat drag bo'lganda scroll qilamiz
    if (hasDraggedRef.current) {
    groupsContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleTouchEnd = (e) => {
    const wasDragging = hasDraggedRef.current;
    const touchedProduct = touchProductRef.current;
    setIsDragging(false);
    if (groupsContainerRef.current) {
      groupsContainerRef.current.classList.remove('is-dragging');
    }
    
    // Agar drag bo'lmagan bo'lsa va mahsulot topilgan bo'lsa, to'g'ridan-to'g'ri navigate qilish
    if (!wasDragging && touchedProduct) {
      // Kichik delay keyin navigate qilish
      setTimeout(() => {
        try {
          // Sessionga saqlash
          sessionStorage.setItem('selectedProduct', JSON.stringify(touchedProduct));
          
          // Sahifani yuqoriga scroll qilish
          window.scrollTo({ top: 0, behavior: 'instant' });
          
          // Navigate qilish - agar xuddi shu sahifada bo'lsak, reload qilish
          if (window.location.pathname === '/product-detail') {
            // Force reload - yangi mahsulotni ko'rsatish uchun
            window.location.reload();
          } else {
            navigate('/product-detail');
          }
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }, 50);
    }
    
    // Drag holatini bir oz kechiktirib tozalaymiz
    setTimeout(() => {
      hasDraggedRef.current = false;
      touchTargetRef.current = null;
      touchProductRef.current = null;
    }, 100);
  };

  const handleProductClick = (product, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Agar drag bo'lgan bo'lsa, mahsulotga o'tmaslik
    if (hasDraggedRef.current) {
      return;
    }
    
    // Agar juda tez bosib yuborilgan bo'lsa ham o'tmaslik (300ms dan kam)
    const clickDuration = Date.now() - clickStartTimeRef.current;
    if (clickDuration < 100) {
      return;
    }
    
    try {
      // Sessionga saqlash
      sessionStorage.setItem('selectedProduct', JSON.stringify(product));
      
      // Sahifani yuqoriga scroll qilish
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Navigate qilish - agar xuddi shu sahifada bo'lsak, reload qilish
      if (window.location.pathname === '/product-detail') {
        // Force reload - yangi mahsulotni ko'rsatish uchun
        window.location.reload();
      } else {
        navigate('/product-detail');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const findMatchingProducts = (productIds, currentProductId) => {
    if (!productIds || !Array.isArray(productIds)) {
      return [];
    }
    return allProducts.filter(p => 
      productIds.includes(p.id) && p.id !== currentProductId
    );
  };

  return (
    <div className="styling-idea-section">
      <div 
        className="styling-idea-container"
        ref={groupsContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentProduct.relatedGroups.map((group, groupIndex) => {
          if (!group || !group.productIds || !Array.isArray(group.productIds)) {
            return null;
          }
          const matchingProducts = findMatchingProducts(group.productIds, currentProduct.id);
          if (matchingProducts.length === 0) return null;

          return (
            <div key={groupIndex} className="styling-idea-group">
              <h2 className="styling-idea-group-title">{getLocalizedText(group.title, lang)}</h2>
              <div className="styling-idea-products">
                {/* Birinchi mahsulot - katta */}
                {matchingProducts.length > 0 && (
                  <div 
                    className="styling-idea-product"
                    data-product-id={matchingProducts[0].id}
                    onClick={(e) => handleProductClick(matchingProducts[0], e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProductClick(matchingProducts[0], e);
                      }
                    }}
                  >
                    <img 
                      className="styling-idea-product-image"
                      src={normalizeImagePath(matchingProducts[0].colors?.[0]?.mainImage || '/img/no-image.png')} 
                      alt={getLocalizedText(matchingProducts[0].title, lang)}
                      draggable="false"
                      onError={(e) => {
                        e.target.src = normalizeImagePath('/img/no-image.png');
                      }}
                    />
                    <div className="styling-idea-product-price">
                      {matchingProducts[0].price || matchingProducts[0].colors?.[0]?.price}
                    </div>
                  </div>
                )}

                {/* Qolgan mahsulotlar - kichik ustun */}
                {matchingProducts.length > 1 && (
                  <div className="styling-idea-right-column">
                    {matchingProducts.slice(1).map((product) => (
                      <div
                        key={product.id}
                        className="styling-idea-product"
                        data-product-id={product.id}
                        onClick={(e) => handleProductClick(product, e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleProductClick(product, e);
                          }
                        }}
                      >
                        <img 
                          className="styling-idea-product-image"
                          src={normalizeImagePath(product.colors?.[0]?.mainImage || '/img/no-image.png')} 
                          alt={getLocalizedText(product.title, lang)}
                          draggable="false"
                          onError={(e) => {
                            e.target.src = normalizeImagePath('/img/no-image.png');
                          }}
                        />
                        <div className="styling-idea-product-price">
                          {product.price || product.colors?.[0]?.price}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StylingIdea;