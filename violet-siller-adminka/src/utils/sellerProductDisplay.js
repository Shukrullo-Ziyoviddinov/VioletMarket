import { resolveAssetUrl } from './mediaUrl';

function trimUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getStorefrontBaseUrl() {
  const configured =
    trimUrl(process.env.REACT_APP_PUBLIC_SITE_URL) ||
    trimUrl(process.env.REACT_APP_STOREFRONT_URL);

  if (configured) return configured;

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  return '';
}

export function buildSellerProductDetailUrl(productId) {
  const id = String(productId || '').trim();
  if (!id) return '';

  const base = getStorefrontBaseUrl();
  const path = `/product-detail?productId=${encodeURIComponent(id)}`;
  return base ? `${base}${path}` : path;
}

export function getSellerLocalizedText(value, lang = 'uz') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value.uz || value.ru || Object.values(value).find(Boolean) || '';
  }
  return String(value);
}

export function resolveSellerProductImageUrl(image) {
  return resolveAssetUrl(image);
}
