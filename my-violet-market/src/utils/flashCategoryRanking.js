function isOutOfStock(product) {
  const qty = Number(product?.effectiveQuantity);
  return Number.isFinite(qty) ? qty <= 0 : false;
}

/** Katta chegirma bo'limi — server `flashCategoryRankingMeta` asosida. */
export function sortProductsByFlashCategoryRanking(products) {
  const list = Array.isArray(products) ? products : [];
  if (list.length <= 1) return list;

  return [...list].sort((a, b) => {
    const aOut = isOutOfStock(a);
    const bOut = isOutOfStock(b);
    if (aOut !== bOut) return aOut ? 1 : -1;

    const am = a.flashCategoryRankingMeta || {};
    const bm = b.flashCategoryRankingMeta || {};
    const aSold = Number(am.soldCount) || 0;
    const bSold = Number(bm.soldCount) || 0;
    if (aSold !== bSold) return bSold - aSold;

    const aScore = Number(am.score) || 0;
    const bScore = Number(bm.score) || 0;
    if (aScore !== bScore) return bScore - aScore;

    const aLast = Number(am.lastSoldAtMs) || 0;
    const bLast = Number(bm.lastSoldAtMs) || 0;
    if (aLast !== bLast) return bLast - aLast;

    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}
