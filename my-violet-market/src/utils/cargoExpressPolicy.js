/** Admin tasdiqlashdan yoziladigan yetkazib berish siyosati (xorij mahsulotlari). */
export const CARGO_EXPRESS_POLICY = {
  UNRESTRICTED: 'unrestricted',
  STANDARD_ONLY: 'standard_only',
};

/**
 * Maydon bo'sh / noma'lum → null (savatda cheklovsiz deb hisoblanadi).
 * @param {unknown} value
 * @returns {'unrestricted' | 'standard_only' | null}
 */
export function normalizeCargoExpressPolicy(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  if (raw === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_EXPRESS_POLICY.STANDARD_ONLY;
  }
  if (raw === CARGO_EXPRESS_POLICY.UNRESTRICTED) {
    return CARGO_EXPRESS_POLICY.UNRESTRICTED;
  }
  return null;
}

/** Express tanlab bo'lmaydigan mahsulot (faqat Standard). */
export function isStandardOnlyCargoItem(productOrItem) {
  return (
    normalizeCargoExpressPolicy(productOrItem?.cargoExpressPolicy) ===
    CARGO_EXPRESS_POLICY.STANDARD_ONLY
  );
}

/** Standard + Express tanlovi bor (bo'sh maydon ham shu). */
export function isUnrestrictedCargoItem(productOrItem) {
  return !isStandardOnlyCargoItem(productOrItem);
}

/**
 * Savat/product payload uchun maydon qiymati.
 * Bo'sh bo'lsa null qaytaradi (UZB va eski mahsulotlar).
 */
export function resolveCargoExpressPolicyForCart(productOrItem) {
  return normalizeCargoExpressPolicy(productOrItem?.cargoExpressPolicy);
}
