import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { formatPrice, getNumberPrice, normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { useToast } from '../../contexts/ToastContext';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import './CartModal.css';

const LOADER_DURATION_MS = 2000;

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

  if (!isOpen || !product) return null;

  const modalContent = (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
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
              <div className="color-options">
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
            </div>
          )}

          {selectedColor?.sizes && selectedColor.sizes.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.sizeLabel')} {selectedSize !== null ? selectedSize : (selectedColor.sizes[0] || '')}</label>
              <div className="size-options">
                {selectedColor.sizes.map((size, index) => {
                  const currentSize = selectedSize !== null ? selectedSize : selectedColor.sizes[0];
                  const isSelected = size === currentSize;
                  return (
                    <button
                      key={index}
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
              <div className="storage-options">
                {selectedColor.storage.map((storage, index) => {
                  const storageValue = typeof storage === 'object' ? storage.size : storage;
                  const defaultStorage = typeof selectedColor.storage[0] === 'object' ? selectedColor.storage[0].size : selectedColor.storage[0];
                  const selectedValue = selectedStorage !== null ? (typeof selectedStorage === 'object' ? selectedStorage.size : selectedStorage) : defaultStorage;
                  const isSelected = storageValue === selectedValue;
                  return (
                    <button
                      key={index}
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
            </div>
          )}

          {selectedColor?.models && selectedColor.models.length > 0 && (
            <div className="cart-modal-option-group">
              <label>{i18n.t('productDetail.modelLabel')} {selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : (typeof selectedColor.models[0] === 'object' ? selectedColor.models[0].name : selectedColor.models[0])}</label>
              <div className="model-options">
                {selectedColor.models.map((model, index) => {
                  const modelName = typeof model === 'object' ? model.name : model;
                  const defaultModel = typeof selectedColor.models[0] === 'object' ? selectedColor.models[0].name : selectedColor.models[0];
                  const selectedName = selectedModel ? (typeof selectedModel === 'object' ? selectedModel.name : selectedModel) : defaultModel;
                  const isSelected = modelName === selectedName;
                  return (
                    <button
                      key={index}
                      className={`model-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedModel(model)}
                    >
                      {modelName}
                    </button>
                  );
                })}
              </div>
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

        {/* Product Policy */}
        <div className="product-policy">
          <div className="policy-block policy-block__linia">
            <i className="bx bx-package"></i>
            <div className="policy-text">
              <h3>{i18n.t('productDetail.policyDeliveryTitle')}</h3>
              <p>{i18n.t('productDetail.policyDeliveryText')}</p>
            </div>
          </div>

          <div className="policy-block policy-block__linia">
            <i className="bx bxs-truck"></i>
            <div className="policy-text">
              <h3>{i18n.t('productDetail.policyServiceTitle')}</h3>
              <p>{i18n.t('productDetail.policyServiceText')}</p>
            </div>
          </div>

          <div className="policy-block policy-block__linia">
            <i className="bx bx-refresh"></i>
            <div className="policy-text">
              <h3>{i18n.t('productDetail.policyReturnTitle')}</h3>
              <p>{i18n.t('productDetail.policyReturnText')}</p>
            </div>
          </div>

          <div className="policy-block policy-block__linia">
            <i className="bx bx-chat"></i>
            <div className="policy-text">
              <h3>{i18n.t('productDetail.policyContactTitle')}</h3>
              <p>{i18n.t('productDetail.policyContactText')}</p>
            </div>
          </div>

          <div className="policy-block">
            <i className="bx bx-credit-card"></i>
            <div className="policy-text">
              <h3>{i18n.t('productDetail.policyPaymentTitle')}</h3>
              <p>{i18n.t('productDetail.policyPaymentText')}</p>
              <div className="payment-icons">
                <img src={normalizeImagePath('/img/Visa_Inc.-Logo.wine.png')} alt="Visa" className="img-policy" />
                <img src={normalizeImagePath('/img/humo kart.jpg')} alt="Humo" className="img-policy" />
                <img src={normalizeImagePath('/img/uzkart.jpg')} alt="Uzcard" className="img-policy" />
                <img src={normalizeImagePath('/img/payme-logo.png')} alt="Payme" className="img-policy" />
              </div>
            </div>
          </div>
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