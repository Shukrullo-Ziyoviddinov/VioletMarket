import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { formatPrice, getNumberPrice, normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { useToast } from '../../contexts/ToastContext';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import Scrollable from '../Scrollable';
import ProductPolicy from '../ProductPolicy';
import './CartModal.css';

const LOADER_DURATION_MS = 2000;
const MOBILE_SHEET_MQ = '(max-width: 768px)';
const SHEET_CLOSE_DRAG_RATIO = 0.3;

const CartModal = ({ product, isOpen, onClose, onAdd }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDragYRef = useRef(0);
  const sheetDragStartClientY = useRef(0);
  const sheetDragStartOffsetY = useRef(0);
  const sheetPointerIdRef = useRef(null);
  const cartModalContentRef = useRef(null);
  const sheetDragHandleRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isMobileSheetLayout = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_SHEET_MQ).matches,
    []
  );

  useEffect(() => {
    if (product) {
      const firstColor = product.colors?.[0];
      setSelectedColor(firstColor || null);
      setSelectedSize(firstColor?.sizes?.[0] || null);
      setSelectedStorage(firstColor?.storage?.[0] || null);
      setSelectedModel(firstColor?.models?.[0] || null);
    }
  }, [product]);

  // Narxni hisoblash (priority: model > storage > color > product)
  const currentPrice = getNumberPrice(selectedModel) ?? 
                       getNumberPrice(selectedStorage) ?? 
                       getNumberPrice(selectedColor) ?? 
                       getNumberPrice(product) ?? 0;

  // OriginalPrice hisoblash (xuddi shu priority)
  const originalPriceValue = selectedModel?.originalPrice ?? 
                             selectedStorage?.originalPrice ?? 
                             selectedColor?.originalPrice ?? 
                             product?.originalPrice ?? null;
  
  // OriginalPrice ni formatlash
  const originalPrice = originalPriceValue 
    ? (typeof originalPriceValue === 'string' && originalPriceValue.includes('UZS')
        ? originalPriceValue
        : (() => {
            const numPrice = getNumberPrice(originalPriceValue);
            return numPrice ? formatPrice(numPrice) : originalPriceValue;
          })())
    : null;

  // Discount hisoblash (xuddi shu priority) - faqat foiz (masalan: "70%")
  const discount = selectedModel?.discount ?? 
                   selectedStorage?.discount ?? 
                   selectedColor?.discount ?? 
                   product?.discount ?? null;

  const handleAddToCart = async () => {
    setIsAddLoading(true);
    await new Promise((r) => setTimeout(r, LOADER_DURATION_MS));
    addToCart(product, selectedColor, selectedSize, selectedStorage, selectedModel);
    showToast('Mahsulot savatga qo\'shildi!', 'success');
    if (onAdd) onAdd();
    setIsAddLoading(false);
    setTimeout(() => onClose(), 100);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedSize(color.sizes?.[0] || null);
    setSelectedStorage(color.storage?.[0] || null);
    setSelectedModel(color.models?.[0] || null);
  };

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

  // Size chart modal ochilganda scroll bloklash
  useEffect(() => {
    if (isSizeChartOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isSizeChartOpen]);

  useEffect(() => {
    if (isOpen) {
      setSheetDragY(0);
      sheetDragYRef.current = 0;
      setSheetDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!sheetDragging) return;

    const onMove = (e) => {
      if (sheetPointerIdRef.current != null && e.pointerId !== sheetPointerIdRef.current) return;
      const dy = e.clientY - sheetDragStartClientY.current;
      const next = Math.max(0, sheetDragStartOffsetY.current + dy);
      sheetDragYRef.current = next;
      setSheetDragY(next);
      if (e.cancelable) e.preventDefault();
    };

    const onEnd = (e) => {
      if (sheetPointerIdRef.current != null && e.pointerId !== sheetPointerIdRef.current) return;
      const h = cartModalContentRef.current?.offsetHeight ?? 0;
      const y = sheetDragYRef.current;
      const pid = sheetPointerIdRef.current;
      setSheetDragging(false);
      sheetPointerIdRef.current = null;
      try {
        if (pid != null && sheetDragHandleRef.current) {
          sheetDragHandleRef.current.releasePointerCapture(pid);
        }
      } catch (_) {
        /* ignore */
      }

      if (isMobileSheetLayout() && h > 0 && y >= h * SHEET_CLOSE_DRAG_RATIO) {
        sheetDragYRef.current = 0;
        setSheetDragY(0);
        onCloseRef.current();
      } else {
        sheetDragYRef.current = 0;
        setSheetDragY(0);
      }
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
    };
  }, [sheetDragging, isMobileSheetLayout]);

  const onSheetDragHandlePointerDown = (e) => {
    if (!isMobileSheetLayout() || isSizeChartOpen) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sheetDragStartClientY.current = e.clientY;
    sheetDragStartOffsetY.current = sheetDragYRef.current;
    sheetPointerIdRef.current = e.pointerId;
    setSheetDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  };

  const sheetWrapStyle = isMobileSheetLayout()
    ? {
        transform: `translate3d(0, ${sheetDragY}px, 0)`,
        transition: sheetDragging
          ? 'none'
          : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
      }
    : undefined;

  /** Fon bosilganda yopish — modal DOM dan ketgach sintetik click ProductCard ga yetmasligi uchun biroz kechiktirish */
  const handleBackdropClick = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    e.stopPropagation();
    window.setTimeout(() => {
      onCloseRef.current();
    }, 50);
  }, []);

  if (!isOpen || !product) return null;

  const modalContent = (
    <div className="cart-modal-overlay" onClick={handleBackdropClick}>
      <div className="cart-modal-sheet" style={sheetWrapStyle}>
        <div
          className="cart-modal-content"
          ref={cartModalContentRef}
          onClick={(e) => e.stopPropagation()}
        >
        <div
          ref={sheetDragHandleRef}
          className="cart-modal-drag-handle"
          onPointerDown={onSheetDragHandlePointerDown}
          role="presentation"
          aria-hidden
        />
        <button className="cart-modal-close" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>
        
        <div className="cart-modal-header">
          <img 
            src={normalizeImagePath(selectedColor?.mainImage || product.colors?.[0]?.mainImage || '/img/no-image.png')} 
            alt={getLocalizedText(product?.title, lang)}
            className="cart-modal-image"
            onError={(e) => {
              e.target.src = normalizeImagePath('/img/no-image.png');
            }}
          />
          <div className="cart-modal-info">
            <h3>{getLocalizedText(product?.title, lang)}</h3>
            <div className="cart-modal-price">
              {formatPrice(currentPrice)}
              {originalPrice && (
                <span className="cart-modal-original-price">{originalPrice}</span>
              )}
              {discount && (
                <span className="cart-modal-discount">{getLocalizedText(discount, lang)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="cart-modal-options">
          {product.colors && product.colors.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.colorLabel')} {getLocalizedText(selectedColor?.name || product.colors[0]?.name, lang)}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="color-options" style={{ display: 'contents' }}>
                  {product.colors.map((color, index) => {
                    const currentColor = selectedColor || product.colors[0];
                    const isSelected = currentColor && (
                      (currentColor.colorFilter && color.colorFilter && currentColor.colorFilter === color.colorFilter) ||
                      (currentColor.mainImage && color.mainImage && currentColor.mainImage === color.mainImage)
                    );
                    return (
                      <img
                        key={index}
                        src={normalizeImagePath(color.mainImage)}
                        alt={getLocalizedText(color.name, lang) || `Color ${index + 1}`}
                        className={`color-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleColorChange(color)}
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                    );
                  })}
                </div>
              </Scrollable>
            </div>
          )}

          {selectedColor?.sizes && selectedColor.sizes.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.sizeLabel')} {selectedSize !== null ? selectedSize : (selectedColor.sizes[0] || '')}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="size-options" style={{ display: 'contents' }}>
                  {selectedColor.sizes.map((size, index) => {
                    const currentSize = selectedSize !== null ? selectedSize : selectedColor.sizes[0];
                    const isSelected = size === currentSize;
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`size-option ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize(size);
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </Scrollable>
              {/* Size Chart */}
              {product.sizeChart && product.sizeChart.length > 0 && (
                <div className="size-chart">
                  <button 
                    className="size-chart-trigger"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsSizeChartOpen(true);
                    }}
                  >
                    <span>{i18n.t('productDetail.sizeChartLabel')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedColor?.storage && selectedColor.storage.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.storageLabel')} {selectedStorage ? (typeof selectedStorage === 'object' ? selectedStorage.size : selectedStorage) : (typeof selectedColor.storage[0] === 'object' ? selectedColor.storage[0].size : selectedColor.storage[0])}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="storage-options" style={{ display: 'contents' }}>
                  {selectedColor.storage.map((storage, index) => {
                    const storageValue = typeof storage === 'object' ? storage.size : storage;
                    const defaultStorage = typeof selectedColor.storage[0] === 'object' ? selectedColor.storage[0].size : selectedColor.storage[0];
                    const selectedValue = selectedStorage !== null ? (typeof selectedStorage === 'object' ? selectedStorage.size : selectedStorage) : defaultStorage;
                    const isSelected = storageValue === selectedValue;
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`storage-option ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStorage(storage);
                        }}
                      >
                        {storageValue}
                      </button>
                    );
                  })}
                </div>
              </Scrollable>
            </div>
          )}

          {selectedColor?.models && selectedColor.models.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.modelLabel')} {selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : (typeof selectedColor.models[0] === 'object' ? selectedColor.models[0].name : selectedColor.models[0])}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="model-options" style={{ display: 'contents' }}>
                  {selectedColor.models.map((model, index) => {
                    const modelName = typeof model === 'object' ? model.name : model;
                    const defaultModel = typeof selectedColor.models[0] === 'object' ? selectedColor.models[0].name : selectedColor.models[0];
                    const selectedName = selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : defaultModel;
                    const isSelected = modelName === selectedName;
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`model-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedModel(model)}
                      >
                        {modelName}
                      </button>
                    );
                  })}
                </div>
              </Scrollable>
            </div>
          )}
        </div>

        <div className="cart-modal-actions">
          <button className="cart-modal-add-btn" onClick={handleAddToCart} disabled={isAddLoading}>
            <ButtonLoader isLoading={isAddLoading}>
              {i18n.t('productCard.addToCart')}
            </ButtonLoader>
          </button>
        </div>

        <ProductPolicy product={product} lang={lang} />
      </div>
      </div>

      {/* Size Chart Modal */}
      {isSizeChartOpen && product.sizeChart && product.sizeChart.length > 0 && (
        <div 
          className="size-chart-modal" 
          onClick={(e) => {
            e.stopPropagation();
            if (e.target.className === 'size-chart-modal' || e.target.classList.contains('size-chart-modal')) {
              setIsSizeChartOpen(false);
              document.body.classList.remove('no-scroll');
            }
          }}
        >
          <div className="size-chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="size-chart-close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSizeChartOpen(false);
                document.body.classList.remove('no-scroll');
              }}
            >
              &times;
            </button>
            <h2>O'lchamlar jadvali</h2>
            <div className="size-chart-images">
              {product.sizeChart.map((imgSrc, index) => (
                <img 
                  key={index}
                  src={normalizeImagePath(imgSrc)} 
                  alt="O'lchamlar jadvali"
                  onError={(e) => {
                    e.target.src = normalizeImagePath('/img/no-image.png');
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default CartModal;