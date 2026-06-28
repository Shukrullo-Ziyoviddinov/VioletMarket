import { getApiBaseUrl } from '../config/api';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f3f4f6"/><text x="50%25" y="52%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12" font-family="sans-serif">Rasm yo\'q</text></svg>';

function getStorefrontBaseUrl() {
  const configured = String(process.env.REACT_APP_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return '';
}

function normalizeRelativePath(rawPath) {
  const normalized = String(rawPath || '').trim().replace(/\\/g, '/');
  if (!normalized) return '';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function resolveAssetUrl(path) {
  if (!path) return FALLBACK_IMAGE;

  const rawPath = String(path).trim();
  if (!rawPath) return FALLBACK_IMAGE;

  const normalized = rawPath.replace(/\\/g, '/');
  if (normalized.startsWith('data:')) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const isUploadPath =
    normalized.startsWith('/uploads/') ||
    normalized.startsWith('uploads/') ||
    normalized.includes('/uploads/') ||
    normalized.startsWith('public/uploads/');

  if (isUploadPath) {
    const uploadStartIndex = normalized.indexOf('/uploads/');
    const uploadRelative =
      uploadStartIndex >= 0
        ? normalized.slice(uploadStartIndex)
        : `/${normalized.replace(/^\/?(?:public\/)?uploads\//, 'uploads/')}`;
    const uploadPath = normalizeRelativePath(uploadRelative);
    return `${getApiBaseUrl()}${uploadPath}`;
  }

  if (/^(admin-|seller-|upload-|image-).+\.[a-z0-9]+$/i.test(normalized)) {
    return `${getApiBaseUrl()}/uploads/${normalized}`;
  }

  const storefrontBase = getStorefrontBaseUrl();
  const storefrontPath = normalizeRelativePath(normalized);
  if (storefrontBase) {
    return `${storefrontBase}${storefrontPath}`;
  }

  if (normalized.startsWith('img/') || normalized.startsWith('/img/')) {
    return `${getApiBaseUrl()}${storefrontPath}`;
  }

  return FALLBACK_IMAGE;
}
