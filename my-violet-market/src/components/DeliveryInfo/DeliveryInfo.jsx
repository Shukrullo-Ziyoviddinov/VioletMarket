import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../../utils/utils';
import './DeliveryInfo.css';

/**
 * DeliveryInfo komponenti - UZB mahsulotlari uchun global ombor ma'lumotini ko'rsatadi
 * 
 * @param {Object} props
 * @param {Object} props.product - Mahsulot obyekti (countries bilan)
 * @param {Array} props.countries - Mahsulot mamlakatlari array (product prop bo'lmasa)
 * @param {Object} props.deliveryInfo - Global UZB ombor yetkazib berish ma'lumotlari
 * @param {boolean} props.showDebug - Debug log'larni ko'rsatish (default: false)
 * @returns {JSX.Element|null}
 */
const DeliveryInfo = ({ product, countries, deliveryInfo, showDebug = false }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  // Agar product prop berilgan bo'lsa, undan countries ni olish
  const productCountries = product?.countries || countries;
  const productDeliveryInfo = deliveryInfo;

  // Tekshiruvlar
  const hasCountries = productCountries && Array.isArray(productCountries);
  const hasUzb = hasCountries && productCountries.some(country => {
    const countryStr = String(country || '').toLowerCase().trim();
    return countryStr === "uzb";
  });
  const hasDeliveryInfo = productDeliveryInfo &&
    (productDeliveryInfo.title != null || productDeliveryInfo.text != null);

  // Debug log
  if (showDebug) {
    console.log('🔍 DeliveryInfo Component Check:', {
      hasCountries,
      countries: productCountries,
      hasUzb,
      hasDeliveryInfo,
      deliveryInfo: productDeliveryInfo,
      shouldShow: hasCountries && hasUzb && hasDeliveryInfo,
      product: product,
      productId: product?.id
    });
  }

  // Agar shartlar bajarilmasa, null qaytarish
  if (!hasCountries || !hasUzb || !hasDeliveryInfo) {
    if (showDebug) {
      console.warn('⚠️ DeliveryInfo ko\'rsatilmayapti:', {
        hasCountries,
        hasUzb,
        hasDeliveryInfo,
        countries: productCountries,
        deliveryInfo: productDeliveryInfo
      });
    }
    return null;
  }

  return (
    <div className="delivery-info">
      <h3 className="delivery-info-title">
        <i className="bx bx-package delivery-info-icon"></i>
        {getLocalizedText(productDeliveryInfo.title, lang) || i18n.t('productDetail.deliveryInfoFallback')}
      </h3>
      {getLocalizedText(productDeliveryInfo.text, lang) && (
        <p className="delivery-info-text">{getLocalizedText(productDeliveryInfo.text, lang)}</p>
      )}
    </div>
  );
};

export default DeliveryInfo;
