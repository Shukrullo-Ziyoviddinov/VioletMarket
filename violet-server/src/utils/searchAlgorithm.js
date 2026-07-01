/** Frontend utils.js qidiruv algoritmi — serverda bir xil mantiq */

function getLocalizedText(value, lang = "uz") {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value[lang] || value.uz || value.ru || "");
  }
  return String(value);
}

function normalizeForSearch(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[-''`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(str) {
  return normalizeForSearch(str)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[b.length][a.length];
}

function tokensMatch(qToken, tToken) {
  if (!qToken || !tToken) return false;
  if (qToken.length < 3 || tToken.length < 3) return false;
  if (tToken.includes(qToken) || qToken.includes(tToken)) return true;
  if (
    qToken.length <= 8 &&
    tToken.length <= 8 &&
    levenshteinDistance(qToken, tToken) <= 1
  ) {
    return true;
  }
  return false;
}

function textContainsRelevantSubstring(textNorm, qNorm) {
  if (!textNorm || !qNorm || qNorm.length < 3) return false;
  if (textNorm.includes(qNorm)) return true;
  for (let len = 3; len <= qNorm.length; len++) {
    const sub = qNorm.slice(0, len);
    if (textNorm.includes(sub)) return true;
  }
  return false;
}

function productMatchesSearchFlexible(product, searchQuery) {
  const q = (searchQuery || "").trim();
  if (!q) return false;

  const titleStr =
    getLocalizedText(product.title, "uz") ||
    getLocalizedText(product.title, "ru") ||
    (typeof product.title === "string" ? product.title : "");
  const productTypeStr = (product.productType || "").toString();
  const categoryStr = (product.category || "").toString();

  const searchableText = [titleStr, productTypeStr, categoryStr]
    .filter(Boolean)
    .join(" ");
  const qNorm = normalizeForSearch(q);
  const searchNorm = normalizeForSearch(searchableText);
  if (!qNorm || !searchNorm) return false;

  if (searchNorm.includes(qNorm)) return true;
  if (qNorm.includes(searchNorm) && searchNorm.length >= 3) return true;

  if (textContainsRelevantSubstring(searchNorm, qNorm)) return true;

  const qTokens = getTokens(q);
  const searchTokens = getTokens(searchableText);

  for (const qt of qTokens) {
    for (const st of searchTokens) {
      if (tokensMatch(qt, st)) return true;
    }
  }

  return false;
}

function filterProductsBySearch(products, searchQuery, limit) {
  const q = (searchQuery || "").trim();
  if (!q) return [];
  const matched = products.filter((p) => productMatchesSearchFlexible(p, q));
  if (limit && limit > 0) return matched.slice(0, limit);
  return matched;
}

const SEARCH_RECOMMENDED_LIMIT = 12;

function getDefaultRecommended(allProducts, count = SEARCH_RECOMMENDED_LIMIT) {
  const withScore = allProducts
    .map((p) => ({
      product: p,
      score: (Number(p.rating) || 0) * 10 + (Number(p.sales) || 0),
    }))
    .sort((a, b) => b.score - a.score);
  return withScore.slice(0, count).map((x) => x.product);
}

/**
 * Search tavsiya — faqat qidiruv tarixi (viewedAt ishlatilmaydi).
 * Mos mahsulotlar + reyting/sotuv bo‘yicha to‘ldirish — har doim 12 tagacha.
 */
function getSimilarRecommended(allProducts, recentSearchQueries) {
  const scores = new Map();
  const list = Array.isArray(allProducts) ? allProducts : [];

  (recentSearchQueries || []).forEach((q) => {
    const trimmed = (q || "").trim();
    if (trimmed.length < 2) return;
    list.forEach((p) => {
      if (!productMatchesSearchFlexible(p, trimmed)) return;
      const cur = scores.get(p.id);
      scores.set(p.id, { product: p, score: (cur?.score ?? 0) + 3 });
    });
  });

  let result = [];
  if (scores.size > 0) {
    result = [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_RECOMMENDED_LIMIT)
      .map((x) => x.product);
  }

  if (result.length < SEARCH_RECOMMENDED_LIMIT) {
    const seen = new Set(result.map((p) => p.id));
    const filler = getDefaultRecommended(
      list.filter((p) => !seen.has(p.id)),
      SEARCH_RECOMMENDED_LIMIT - result.length,
    );
    result = [...result, ...filler];
  }

  if (result.length === 0) {
    return getDefaultRecommended(list, SEARCH_RECOMMENDED_LIMIT);
  }

  return result;
}

module.exports = {
  filterProductsBySearch,
  getSimilarRecommended,
  getDefaultRecommended,
  productMatchesSearchFlexible,
  getLocalizedText,
  normalizeForSearch,
  getTokens,
  tokensMatch,
  levenshteinDistance,
  textContainsRelevantSubstring,
};
