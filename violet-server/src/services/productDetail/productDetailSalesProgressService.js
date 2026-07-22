function toNonNegativeInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function resolveProgressTone(remainingPercent) {
  if (remainingPercent < 20) return "danger";
  if (remainingPercent <= 45) return "warning-mix";
  if (remainingPercent <= 50) return "warning";
  return "success";
}

function buildProductDetailSalesProgressMeta(product) {
  const soldCount = toNonNegativeInt(product?.flashSaleSoldCount, 0);
  const remainingQuantity = toNonNegativeInt(
    product?.effectiveQuantity ?? product?.quantity,
    0,
  );
  // Checkout band qilgan, lekin hali topshirilmagan donalar.
  // Ularni denominatorga qo‘shmasak, qoldiq kamayganda «sotildi %» noto‘g‘ri oshadi.
  const reservedQuantity = toNonNegativeInt(product?.reservedQuantity, 0);
  const total = soldCount + remainingQuantity + reservedQuantity;

  const soldPercent = total > 0 ? clampPercent((soldCount / total) * 100) : 0;
  const remainingPercent = total > 0 ? clampPercent((remainingQuantity / total) * 100) : 100;

  return {
    soldCount,
    remainingQuantity,
    reservedQuantity,
    soldPercent,
    remainingPercent,
    tone: resolveProgressTone(remainingPercent),
  };
}

function decorateWithProductDetailSalesProgressMeta(products) {
  return (Array.isArray(products) ? products : []).map((product) => ({
    ...product,
    productDetailSalesMeta: buildProductDetailSalesProgressMeta(product),
  }));
}

module.exports = {
  buildProductDetailSalesProgressMeta,
  decorateWithProductDetailSalesProgressMeta,
};
