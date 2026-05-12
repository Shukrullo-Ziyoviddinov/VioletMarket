import defaultProductPolicy from '../data/defaultProductPolicy.json';

/**
 * Boxicons classlari — admin/CMS faqat kalit yozadi (HTML emas).
 * Yangi ikonka: shu xaritaga qo‘shing.
 */
export const PRODUCT_POLICY_ICON_MAP = Object.freeze({
  package: 'bx bx-package',
  truck: 'bx bxs-truck',
  refresh: 'bx bx-refresh',
  chat: 'bx bx-chat',
  'credit-card': 'bx bx-credit-card',
});

export function getProductPolicyIconClass(iconKey) {
  if (typeof iconKey !== 'string' || !iconKey.trim()) {
    return 'bx bx-info-circle';
  }
  return PRODUCT_POLICY_ICON_MAP[iconKey.trim()] || 'bx bx-info-circle';
}

/**
 * Mahsulotda policy bo‘lmasa — defaultProductPolicy.json.
 * Override: product.policy.blocks — har bir element:
 * { icon, title, text, divider?, paymentIcons?: [{ src, alt }] }
 * paymentIcons ixtiyoriy; alt — string yoki { uz, ru }.
 */
export function getProductPolicyBlocks(product) {
  const raw = product?.policy?.blocks ?? product?.policyBlocks;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw;
  }
  return defaultProductPolicy;
}
