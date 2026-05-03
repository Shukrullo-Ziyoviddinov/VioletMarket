/**
 * Tavsiya etamiz – mahsulot tavsiyalari xizmati.
 * Backend qo'shilganda faqat shu funksiyalarni API chaqiruqlariga almashtiring.
 * 
 * Backend API misol:
 * - GET /api/recommendations?productId=123&viewedIds=1,2,3
 * - GET /api/recommendations/similar?productId=123
 */

/**
 * Mahsulotning o'xshashlik ballini hisoblaydi.
 * category, productCountry, brandCategories, countriesCategories, productType bo'yicha.
 * @param {Object} product - Tekshirilayotgan mahsulot
 * @param {Object} reference - Referans mahsulot (joriy yoki ko'rilgan)
 * @returns {number} 0–100 oraliqda ball (yuqori = ko'proq o'xshash)
 */
export function calculateSimilarityScore(product, reference) {
  if (!product || !reference || product.id === reference.id) return 0;

  let score = 0;
  const weights = {
    category: 30,
    productType: 25,
    productCountry: 20,
    brandCategories: 15,
    countriesCategories: 10,
  };

  const norm = (v) => (v && String(v).toLowerCase().trim()) || '';

  if (norm(product.category) === norm(reference.category)) score += weights.category;
  if (norm(product.productType) === norm(reference.productType)) score += weights.productType;
  if (norm(product.productCountry) === norm(reference.productCountry)) score += weights.productCountry;
  if (norm(product.brandCategories) === norm(reference.brandCategories)) score += weights.brandCategories;
  if (norm(product.countriesCategories) === norm(reference.countriesCategories)) score += weights.countriesCategories;

  return score;
}

/**
 * Joriy mahsulotga o'xshash mahsulotlarni topadi.
 * category, productCountry, brandCategories, countriesCategories bo'yicha filterlaydi.
 * 
 * @param {Object} currentProduct - Joriy mahsulot (product detail sahifasidagi)
 * @param {Array} allProducts - Barcha mahsulotlar
 * @param {number} limit - Maksimal soni
 * @returns {Array} O'xshash mahsulotlar (ball bo'yicha tartiblangan)
 */
export function getSimilarProducts(currentProduct, allProducts, limit = 12) {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) return [];

  const scored = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .map((p) => ({
      product: p,
      score: calculateSimilarityScore(p, currentProduct),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);

  return scored;
}

/**
 * Foydalanuvchi ko'rgan mahsulotlarga o'xshash mahsulotlarni topadi.
 * Ko'rilgan mahsulotlar va ularga o'xshashlar aralashadi.
 * 
 * @param {Array<number>} viewedProductIds - Ko'rilgan mahsulot ID lari
 * @param {Array} allProducts - Barcha mahsulotlar
 * @param {number} limit - Maksimal soni
 * @returns {Array} Tavsiya qilinadigan mahsulotlar
 */
export function getRecommendationsByViewingHistory(viewedProductIds, allProducts, limit = 12) {
  if (!Array.isArray(viewedProductIds) || viewedProductIds.length === 0 || !Array.isArray(allProducts)) {
    return [];
  }

  const productById = new Map(allProducts.map((p) => [p.id, p]));
  const viewedProducts = viewedProductIds
    .map((id) => productById.get(id))
    .filter(Boolean);

  if (viewedProducts.length === 0) return [];

  const seenIds = new Set();
  const result = [];

  // Har bir ko'rilgan mahsulot uchun o'xshashlarni topamiz
  for (const ref of viewedProducts) {
    const similar = getSimilarProducts(ref, allProducts, 4);
    for (const p of similar) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        result.push({ product: p, sourceScore: 100 });
      }
    }
  }

  // productType va category bo'yicha qo'shimcha o'xshashlar (masalan kitob -> kanselyariya)
  const refProduct = viewedProducts[0];
  const relatedByType = allProducts.filter((p) => {
    if (seenIds.has(p.id)) return false;
    const sameType = p.productType === refProduct?.productType;
    const sameCategory = p.category === refProduct?.category;
    const relatedCategory = isRelatedCategory(p.category, refProduct?.category);
    return sameType || sameCategory || relatedCategory;
  });

  for (const p of relatedByType) {
    if (result.length >= limit) break;
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      result.push({ product: p, sourceScore: 50 });
    }
  }

  return result.slice(0, limit).map(({ product }) => product);
}

/**
 * Bog'liq kategoriyalar (masalan Kitoblar <-> Kanselyariya)
 * Kitob ko'rilganda kanselyariya va aksessuarlar ham chiqadi
 */
function isRelatedCategory(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const related = [
    ['Kitoblar', 'Kanselyariya tovarlari'],
    ['Kitoblar', 'Aksessuarlar'],
    ['Aksessuarlar', 'Elektronika'],
    ['Kanselyariya tovarlari', 'Kitoblar'],
  ];
  const n1 = String(cat1).toLowerCase();
  const n2 = String(cat2).toLowerCase();
  return related.some(([a, b]) => {
    const an = a.toLowerCase();
    const bn = b.toLowerCase();
    return (n1.includes(an) && n2.includes(bn)) || (n1.includes(bn) && n2.includes(an));
  });
}

/**
 * Joriy mahsulot turiga bog'liq mahsulotlar (masalan kitob -> kanselyariya)
 */
function getRelatedByCategory(currentProduct, allProducts, limit = 4) {
  if (!currentProduct?.category || !Array.isArray(allProducts)) return [];
  const cat = currentProduct.category;
  return allProducts
    .filter((p) => p.id !== currentProduct.id && isRelatedCategory(p.category, cat))
    .slice(0, limit);
}

/**
 * Product detail sahifasi uchun birlashtirilgan tavsiyalar.
 * Joriy mahsulotga o'xshashlar + ko'rilgan mahsulotlarga o'xshashlar.
 * Ko'rilganlar va ularga o'xshashlar yuqoriga chiqadi.
 * 
 * @param {Object} currentProduct - Joriy mahsulot
 * @param {Array<number>} viewedProductIds - Ko'rilgan mahsulot ID lari
 * @param {Array} allProducts - Barcha mahsulotlar
 * @param {number} limit - Maksimal soni
 * @returns {Array} Tavsiya qilinadigan mahsulotlar
 */
export function getRecommendationsForProductDetail(
  currentProduct,
  viewedProductIds,
  allProducts,
  limit = 12
) {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) return [];

  const currentId = currentProduct.id;
  const seenIds = new Set([currentId, String(currentId)]);
  const isExcluded = (id) => id == currentId || String(id) === String(currentId);
  const result = [];

  // 1. Joriy mahsulotga o'xshashlar (category, productCountry, brandCategories, countriesCategories)
  const similarToCurrent = getSimilarProducts(currentProduct, allProducts, limit);
  for (const p of similarToCurrent) {
    if (!isExcluded(p.id)) {
      seenIds.add(p.id);
      seenIds.add(String(p.id));
      result.push(p);
    }
  }

  // 1b. Bog'liq kategoriyalar (masalan kitob -> kanselyariya)
  const relatedByCat = getRelatedByCategory(currentProduct, allProducts, 4);
  for (const p of relatedByCat) {
    if (!isExcluded(p.id)) {
      seenIds.add(p.id);
      seenIds.add(String(p.id));
      result.push(p);
    }
  }

  // 2. Ko'rilgan mahsulotlarga o'xshashlar – ular yuqoriga chiqadi
  if (Array.isArray(viewedProductIds) && viewedProductIds.length > 0) {
    const productById = new Map(allProducts.map((p) => [p.id, p]));
    const productByIdStr = new Map(allProducts.map((p) => [String(p.id), p]));
    const getProduct = (id) => productById.get(id) ?? productByIdStr.get(String(id));
    const viewedProducts = viewedProductIds
      .map((id) => getProduct(id))
      .filter((p) => p && !isExcluded(p.id));

    for (const ref of viewedProducts) {
      const similar = getSimilarProducts(ref, allProducts, 4);
      for (const p of similar) {
        if (!isExcluded(p.id)) {
          seenIds.add(p.id);
          seenIds.add(String(p.id));
          result.unshift(p); // Ko'rilganlarga o'xshashlar boshiga
        }
      }
    }
  }

  // 3. Fallback: agar hech narsa topilmasa – category, productType yoki barcha mahsulotlar
  if (result.length === 0) {
    const norm = (v) => (v && String(v).toLowerCase().trim()) || '';
    const currentCat = norm(currentProduct.category);
    const currentType = norm(currentProduct.productType);

    // Avval category bo'yicha (agar category mavjud bo'lsa)
    if (currentCat) {
      const byCategory = allProducts.filter(
        (p) => !isExcluded(p.id) && norm(p.category) === currentCat
      );
      for (const p of byCategory.slice(0, limit)) {
        result.push(p);
      }
    }

    // Keyin productType bo'yicha
    if (result.length < limit && currentType) {
      for (const p of allProducts) {
        if (result.length >= limit) break;
        if (isExcluded(p.id)) continue;
        if (result.some((r) => r.id == p.id || String(r.id) === String(p.id))) continue;
        if (norm(p.productType) === currentType) result.push(p);
      }
    }

    // Oxirgi fallback: barcha mahsulotlardan (joriy mahsulotsiz)
    if (result.length === 0) {
      const others = allProducts.filter((p) => !isExcluded(p.id));
      return others.slice(0, limit);
    }
  }

  return result.slice(0, limit);
}

// ============ Backend-ready API interface ============
// Keyinchalik backend qo'shilganda shu funksiyalarni API chaqiruqlariga almashtiring.

const USE_BACKEND = false; // Backend tayyor bo'lganda true qiling

/**
 * Backend orqali tavsiyalar olish (kelajakda).
 * @param {string} productId - Joriy mahsulot ID
 * @param {string} viewedIds - Ko'rilgan ID lar vergul bilan
 */
async function fetchRecommendationsFromBackend(productId, viewedIds) {
  const params = new URLSearchParams({ productId, viewedIds: viewedIds || '' });
  const res = await fetch(`/api/recommendations?${params}`);
  if (!res.ok) throw new Error('Recommendations fetch failed');
  return res.json();
}

/**
 * Tavsiyalarni olish – frontend yoki backend.
 * Backend qo'shilganda faqat shu funksiyani o'zgartiring.
 */
export async function fetchRecommendations(currentProduct, viewedProductIds, allProducts, limit = 12) {
  if (USE_BACKEND && currentProduct?.id) {
    try {
      const data = await fetchRecommendationsFromBackend(
        String(currentProduct.id),
        (viewedProductIds || []).join(',')
      );
      return Array.isArray(data.products) ? data.products : [];
    } catch {
      // Fallback to frontend logic
    }
  }

  return getRecommendationsForProductDetail(
    currentProduct,
    viewedProductIds,
    allProducts,
    limit
  );
}
