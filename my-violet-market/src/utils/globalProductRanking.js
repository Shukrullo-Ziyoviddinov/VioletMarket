function isOutOfStock(product) {
  const qty = Number(product?.effectiveQuantity);
  return Number.isFinite(qty) ? qty <= 0 : false;
}

/** Server `globalRankingMeta` asosida — Trenddagilar tab tartibi. */
export function sortProductsByGlobalRanking(products) {
  const list = Array.isArray(products) ? products : [];
  if (list.length <= 1) return list;

  return [...list].sort((a, b) => {
    const aOut = isOutOfStock(a);
    const bOut = isOutOfStock(b);
    if (aOut !== bOut) return aOut ? 1 : -1;

    const am = a.globalRankingMeta || {};
    const bm = b.globalRankingMeta || {};
    const aSold = Number(am.soldCount) || 0;
    const bSold = Number(bm.soldCount) || 0;
    if (aSold !== bSold) return bSold - aSold;

    const aScore = Number(am.score) || 0;
    const bScore = Number(bm.score) || 0;
    if (aScore !== bScore) return bScore - aScore;

    const aLast = Number(am.lastSoldAtMs) || 0;
    const bLast = Number(bm.lastSoldAtMs) || 0;
    if (aLast !== bLast) return bLast - aLast;

    return (Number(am.sortIndex) || 0) - (Number(bm.sortIndex) || 0);
  });
}
