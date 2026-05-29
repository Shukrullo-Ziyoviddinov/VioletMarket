/** Savat / buyurtma snapshot elementidan mahsulot ID */
export function getCartItemProductId(item) {
  if (!item || typeof item !== 'object') return null;
  const raw = item.id ?? item.productId;
  if (raw == null || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/** Savat elementini DOM / ro'yxatda bog'lash uchun kalit */
export function getCartItemKey(item) {
  if (!item) return '';
  return (
    item.cartItemId ||
    `${item.id ?? item.productId ?? ''}-${item.color ?? ''}-${item.size ?? ''}-${item.storage ?? ''}-${item.model ?? ''}`
  );
}
