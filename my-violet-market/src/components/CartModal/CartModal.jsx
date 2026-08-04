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

const MOBILE_SHEET_MQ = '(max-width: 768px)';
const SHEET_CLOSE_DRAG_RATIO = 0.3;

const getStockKeys = (stockMap) =>
  stockMap && typeof stockMap === 'object' && !Array.isArray(stockMap)
    ? Object.keys(stockMap)
    : [];

const getOptionList = (list, stockMap) => {
  const keys = getStockKeys(stockMap);
  if (keys.length > 0) return keys;
  return Array.isArray(list) ? list : [];
};

const normalizeVariantLabel = (value) => String(value || '').trim().toLowerCase();

const toStockNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
};

const getStockEntryQuantity = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return toStockNumber(value.quantity);
  }
  return toStockNumber(value);
};

const findStockValue = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  return getStockEntryQuantity(stockMap[key]);
};

const getStockPriceByLabel = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  const entry = stockMap[key];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return getNumberPrice(entry.price);
};

const getStockOriginalPriceByLabel = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  const entry = stockMap[key];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return getNumberPrice(entry.originalPrice);
};

const getStorageValue = (storage) =>
  typeof storage === 'object' && storage?.size ? storage.size : storage;

const getModelValue = (model) =>
  typeof model === 'object' && model?.name ? model.name : model;

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

  const getColorLabel = useCallback(
    (color) => getLocalizedText(color?.name, lang) || color?.colorFilter || '',
    [lang],
  );

  const isColorAvailable = useCallback(
    (color) => {
      if (!product) return true;
      const qty =
        findStockValue(product?.colorStock, getColorLabel(color)) ??
        toStockNumber(color?.quantity);
      return qty === null || qty > 0;
    },
    [getColorLabel, product],
  );

  const isSizeAvailable = useCallback(
    (color, sizeOption) => {
      if (!product) return true;
      const colorQty =
        findStockValue(product?.colorStock, getColorLabel(color)) ??
        toStockNumber(color?.quantity);
      if (colorQty !== null && colorQty <= 0) return false;
      const sizeQty = findStockValue(color?.sizeStock || product?.sizeStock, sizeOption);
      return sizeQty === null || sizeQty > 0;
    },
    [getColorLabel, product],
  );

  const isStorageAvailable = useCallback(
    (color, storageOption) => {
      if (!product) return true;
      const colorQty =
        findStockValue(product?.colorStock, getColorLabel(color)) ??
        toStockNumber(color?.quantity);
      if (colorQty !== null && colorQty <= 0) return false;

      const ownQty = toStockNumber(storageOption?.quantity);
      if (ownQty !== null) return ownQty > 0;

      const storageQty = findStockValue(
        color?.storageStock || product?.storageStock,
        getStorageValue(storageOption),
      );
      return storageQty === null || storageQty > 0;
    },
    [getColorLabel, product],
  );

  const isModelAvailable = useCallback(
    (color, modelOption) => {
      if (!product) return true;
      const colorQty =
        findStockValue(product?.colorStock, getColorLabel(color)) ??
        toStockNumber(color?.quantity);
      if (colorQty !== null && colorQty <= 0) return false;

      const ownQty = toStockNumber(modelOption?.quantity);
      if (ownQty !== null) return ownQty > 0;

      const modelQty = findStockValue(
        color?.modelStock || product?.modelStock,
        getModelValue(modelOption),
      );
      return modelQty === null || modelQty > 0;
    },
    [getColorLabel, product],
  );

  const pickFirstAvailable = useCallback((list, checker) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const found = list.find((item) => checker(item));
    return found ?? list[0];
  }, []);

  const applyColorSelection = useCallback((color) => {
    if (!product) return;
    if (color && !isColorAvailable(color)) return;

    const sizeChoicesForColor = getOptionList(color?.sizes, color?.sizeStock || product.sizeStock);
    const storageChoicesForColor = getOptionList(
      color?.storage || product.storage,
      color?.storageStock || product.storageStock,
    );
    const modelChoicesForColor = getOptionList(
      color?.models || product.models,
      color?.modelStock || product.modelStock,
    );

    setSelectedColor(color || null);
    setSelectedSize(pickFirstAvailable(sizeChoicesForColor, (option) => isSizeAvailable(color, option)));
    setSelectedStorage(
      pickFirstAvailable(storageChoicesForColor, (option) => isStorageAvailable(color, option)),
    );
    setSelectedModel(
      pickFirstAvailable(modelChoicesForColor, (option) => isModelAvailable(color, option)),
    );
  }, [isColorAvailable, isModelAvailable, isSizeAvailable, isStorageAvailable, pickFirstAvailable, product]);

  useEffect(() => {
    if (!isOpen || !product) return;
    setIsAddLoading(false);
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const firstColor = pickFirstAvailable(colors, isColorAvailable) || colors[0] || null;
    applyColorSelection(firstColor);
  }, [applyColorSelection, isColorAvailable, isOpen, pickFirstAvailable, product]);

  const modelLabel = getModelValue(selectedModel);
  const storageLabel = getStorageValue(selectedStorage);
  const modelStockPrice = getStockPriceByLabel(
    selectedColor?.modelStock || product?.modelStock,
    modelLabel,
  );
  const modelStockOriginalPrice = getStockOriginalPriceByLabel(
    selectedColor?.modelStock || product?.modelStock,
    modelLabel,
  );
  const storageStockPrice = getStockPriceByLabel(
    selectedColor?.storageStock || product?.storageStock,
    storageLabel,
  );
  const storageStockOriginalPrice = getStockOriginalPriceByLabel(
    selectedColor?.storageStock || product?.storageStock,
    storageLabel,
  );

  // Narxni hisoblash (priority: model > modelStock > storage > storageStock > color > product)
  const currentPrice = getNumberPrice(selectedModel) ?? 
                       modelStockPrice ??
                       getNumberPrice(selectedStorage) ?? 
                       storageStockPrice ??
                       getNumberPrice(selectedColor) ?? 
                       getNumberPrice(product) ?? 0;

  // OriginalPrice hisoblash (xuddi shu priority)
  const originalPriceValue = selectedModel?.originalPrice ?? 
                             modelStockOriginalPrice ??
                             selectedStorage?.originalPrice ?? 
                             storageStockOriginalPrice ??
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

  const sizeChoices = getOptionList(selectedColor?.sizes, selectedColor?.sizeStock || product?.sizeStock);
  const storageChoices = getOptionList(selectedColor?.storage || product?.storage, selectedColor?.storageStock || product?.storageStock);
  const modelChoices = getOptionList(selectedColor?.models || product?.models, selectedColor?.modelStock || product?.modelStock);

  const handleAddToCart = async () => {
    if (isAddLoading) return;
    setIsAddLoading(true);
    try {
      await addToCart(product, selectedColor, selectedSize, selectedStorage, selectedModel);
      showToast(i18n.t('cart.toastAdded'), 'success');
      if (onAdd) onAdd();
      setTimeout(() => onClose(), 100);
    } catch {
      // Xato toast CartContext da; modal yopilmaydi — yana urinish mumkin
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleColorChange = (color) => {
    applyColorSelection(color);
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
            src={normalizeImagePath(selectedColor?.mainImage || product.image || product.mainImage || product.colors?.[0]?.mainImage || '/img/no-image.png')} 
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
                    const unavailable = !isColorAvailable(color);
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`color-option-wrap ${unavailable ? 'color-option-wrap--unavailable' : ''}`}
                        disabled={unavailable}
                        onClick={() => handleColorChange(color)}
                      >
                        <img
                          src={normalizeImagePath(color.mainImage)}
                          alt={getLocalizedText(color.name, lang) || `Color ${index + 1}`}
                          className={`color-option ${isSelected ? 'selected' : ''}`}
                          onError={(e) => {
                            e.target.src = normalizeImagePath('/img/no-image.png');
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </Scrollable>
            </div>
          )}

          {sizeChoices.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.sizeLabel')} {selectedSize !== null ? selectedSize : (sizeChoices[0] || '')}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="size-options" style={{ display: 'contents' }}>
                  {sizeChoices.map((size, index) => {
                    const currentSize = selectedSize !== null ? selectedSize : sizeChoices[0];
                    const isSelected = size === currentSize;
                    const unavailable = !isSizeAvailable(selectedColor, size);
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`size-option ${isSelected ? 'selected' : ''} ${
                          unavailable ? 'size-option--unavailable' : ''
                        }`}
                        disabled={unavailable}
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

          {storageChoices.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.storageLabel')} {selectedStorage ? (typeof selectedStorage === 'object' ? selectedStorage.size : selectedStorage) : (typeof storageChoices[0] === 'object' ? storageChoices[0].size : storageChoices[0])}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="storage-options" style={{ display: 'contents' }}>
                  {storageChoices.map((storage, index) => {
                    const storageValue = typeof storage === 'object' ? storage.size : storage;
                    const defaultStorage = typeof storageChoices[0] === 'object' ? storageChoices[0].size : storageChoices[0];
                    const selectedValue = selectedStorage !== null ? (typeof selectedStorage === 'object' ? selectedStorage.size : selectedStorage) : defaultStorage;
                    const isSelected = storageValue === selectedValue;
                    const unavailable = !isStorageAvailable(selectedColor, storage);
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`storage-option ${isSelected ? 'selected' : ''} ${
                          unavailable ? 'storage-option--unavailable' : ''
                        }`}
                        disabled={unavailable}
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

          {modelChoices.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.modelLabel')} {selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : (typeof modelChoices[0] === 'object' ? modelChoices[0].name : modelChoices[0])}</label>
              <Scrollable type="product" className="cart-modal-options-scroll" skipInteractiveTouchHandling>
                <div className="model-options" style={{ display: 'contents' }}>
                  {modelChoices.map((model, index) => {
                    const modelName = typeof model === 'object' ? model.name : model;
                    const defaultModel = typeof modelChoices[0] === 'object' ? modelChoices[0].name : modelChoices[0];
                    const selectedName = selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : defaultModel;
                    const isSelected = modelName === selectedName;
                    const unavailable = !isModelAvailable(selectedColor, model);
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`model-option ${isSelected ? 'selected' : ''} ${
                          unavailable ? 'model-option--unavailable' : ''
                        }`}
                        disabled={unavailable}
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
