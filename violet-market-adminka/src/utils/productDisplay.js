import { getApiBaseUrl } from '../config/api';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f3f4f6"/><text x="50%25" y="52%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12" font-family="sans-serif">No image</text></svg>';

function getStorefrontBaseUrl() {
  const raw = (process.env.REACT_APP_STOREFRONT_URL || 'http://localhost:3000').trim();
  return raw.replace(/\/+$/, '');
}

export function getLocalizedText(value, lang = 'uz') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value.uz || value.ru || Object.values(value).find(Boolean) || '';
  }
  return String(value);
}

export function formatStatNumber(value) {
  return new Intl.NumberFormat('uz-UZ').format(Number(value) || 0);
}

export function formatTodayHighlight(count) {
  const n = Number(count) || 0;
  return n > 0 ? `+${n}` : '0';
}

export function resolveProductImageUrl(imagePath) {
  if (!imagePath) return FALLBACK_IMAGE;

  const rawPath = String(imagePath).trim();
  if (!rawPath) return FALLBACK_IMAGE;

  const normalizedSlashes = rawPath.replace(/\\/g, '/');

  if (normalizedSlashes.startsWith('data:')) return normalizedSlashes;
  if (/^https?:\/\//i.test(normalizedSlashes)) return normalizedSlashes;

  const isUploadPath =
    normalizedSlashes.startsWith('/uploads/') ||
    normalizedSlashes.startsWith('uploads/') ||
    normalizedSlashes.includes('/uploads/');

  if (isUploadPath) {
    const uploadStartIndex = normalizedSlashes.indexOf('/uploads/');
    const uploadRelative =
      uploadStartIndex >= 0
        ? normalizedSlashes.slice(uploadStartIndex)
        : `/${normalizedSlashes.replace(/^\/?uploads\//, 'uploads/')}`;
    const normalizedUploadPath = uploadRelative.startsWith('/')
      ? uploadRelative
      : `/${uploadRelative}`;
    return `${getApiBaseUrl()}${normalizedUploadPath}`;
  }

  if (/^(admin-|upload-|image-).+\.[a-z0-9]+$/i.test(normalizedSlashes)) {
    return `${getApiBaseUrl()}/uploads/${normalizedSlashes}`;
  }

  const storefrontPath = normalizedSlashes.startsWith('/')
    ? normalizedSlashes
    : `/${normalizedSlashes}`;

  return `${getStorefrontBaseUrl()}${storefrontPath}`;
}
