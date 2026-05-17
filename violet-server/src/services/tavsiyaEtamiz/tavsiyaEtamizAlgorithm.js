const {
  norm,
  hasLimit,
  sliceIfLimited,
  buildProductLookup,
} = require("./tavsiyaEtamizHelpers");

function calculateSimilarityScore(product, reference) {
  if (!product || !reference || product.id === reference.id) return 0;

  let score = 0;
  const weights = {
    category: 30,
    productType: 25,
    productCountry: 20,
    brandCategories: 15,
    countriesCategories: 10,
  };

  if (norm(product.category) === norm(reference.category)) score += weights.category;
  if (norm(product.productType) === norm(reference.productType)) score += weights.productType;
  if (norm(product.productCountry) === norm(reference.productCountry)) {
    score += weights.productCountry;
  }
  if (norm(product.brandCategories) === norm(reference.brandCategories)) {
    score += weights.brandCategories;
  }
  if (norm(product.countriesCategories) === norm(reference.countriesCategories)) {
    score += weights.countriesCategories;
  }

  return score;
}

function isRelatedCategory(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const related = [
    ["Kitoblar", "Kanselyariya tovarlari"],
    ["Kitoblar", "Aksessuarlar"],
    ["Aksessuarlar", "Elektronika"],
    ["Kanselyariya tovarlari", "Kitoblar"],
  ];
  const n1 = String(cat1).toLowerCase();
  const n2 = String(cat2).toLowerCase();
  return related.some(([a, b]) => {
    const an = a.toLowerCase();
    const bn = b.toLowerCase();
    return (n1.includes(an) && n2.includes(bn)) || (n1.includes(bn) && n2.includes(an));
  });
}

function getSimilarProducts(currentProduct, allProducts, limit) {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) {
    return [];
  }

  const ranked = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .map((p) => ({
      product: p,
      score: calculateSimilarityScore(p, currentProduct),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return sliceIfLimited(ranked, limit).map(({ product }) => product);
}

function getRelatedByCategory(currentProduct, allProducts, limit = 4) {
  if (!currentProduct?.category || !Array.isArray(allProducts)) return [];
  const cat = currentProduct.category;
  return allProducts
    .filter((p) => p.id !== currentProduct.id && isRelatedCategory(p.category, cat))
    .slice(0, limit);
}

/** Cart / Profile / Wishlist — viewedAt ID lar bo'yicha */
function getRecommendationsByViewingHistory(viewedProductIds, allProducts, limit) {
  if (
    !Array.isArray(viewedProductIds) ||
    viewedProductIds.length === 0 ||
    !Array.isArray(allProducts)
  ) {
    return [];
  }

  const { getProduct } = buildProductLookup(allProducts);
  const viewedProducts = viewedProductIds.map((id) => getProduct(id)).filter(Boolean);
  if (viewedProducts.length === 0) return [];

  const seenIds = new Set();
  const result = [];

  for (const ref of viewedProducts) {
    const similar = getSimilarProducts(ref, allProducts, 4);
    for (const p of similar) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        result.push(p);
      }
    }
  }

  const refProduct = viewedProducts[0];
  const relatedByType = allProducts.filter((p) => {
    if (seenIds.has(p.id)) return false;
    const sameType = p.productType === refProduct?.productType;
    const sameCategory = p.category === refProduct?.category;
    const relatedCategory = isRelatedCategory(p.category, refProduct?.category);
    return sameType || sameCategory || relatedCategory;
  });

  for (const p of relatedByType) {
    if (hasLimit(limit) && result.length >= limit) break;
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      result.push(p);
    }
  }

  return sliceIfLimited(result, limit);
}

/** Product detail — joriy mahsulot + viewedAt */
function getRecommendationsForProductDetail(
  currentProduct,
  viewedProductIds,
  allProducts,
  limit,
) {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) {
    return [];
  }

  const currentId = currentProduct.id;
  const seenIds = new Set([currentId, String(currentId)]);
  const isExcluded = (id) => id == currentId || String(id) === String(currentId);
  const result = [];

  const similarToCurrent = getSimilarProducts(currentProduct, allProducts, limit);
  for (const p of similarToCurrent) {
    if (!isExcluded(p.id)) {
      seenIds.add(p.id);
      seenIds.add(String(p.id));
      result.push(p);
    }
  }

  const relatedByCat = getRelatedByCategory(currentProduct, allProducts, 4);
  for (const p of relatedByCat) {
    if (!isExcluded(p.id)) {
      seenIds.add(p.id);
      seenIds.add(String(p.id));
      result.push(p);
    }
  }

  if (Array.isArray(viewedProductIds) && viewedProductIds.length > 0) {
    const { getProduct } = buildProductLookup(allProducts);
    const viewedProducts = viewedProductIds
      .map((id) => getProduct(id))
      .filter((p) => p && !isExcluded(p.id));

    for (const ref of viewedProducts) {
      const similar = getSimilarProducts(ref, allProducts, 4);
      for (const p of similar) {
        if (!isExcluded(p.id)) {
          seenIds.add(p.id);
          seenIds.add(String(p.id));
          result.unshift(p);
        }
      }
    }
  }

  if (result.length === 0) {
    const currentCat = norm(currentProduct.category);
    const currentType = norm(currentProduct.productType);

    if (currentCat) {
      const byCategory = allProducts.filter(
        (p) => !isExcluded(p.id) && norm(p.category) === currentCat,
      );
      for (const p of sliceIfLimited(byCategory, limit)) {
        result.push(p);
      }
    }

    if ((!hasLimit(limit) || result.length < limit) && currentType) {
      for (const p of allProducts) {
        if (hasLimit(limit) && result.length >= limit) break;
        if (isExcluded(p.id)) continue;
        if (result.some((r) => r.id == p.id || String(r.id) === String(p.id))) continue;
        if (norm(p.productType) === currentType) result.push(p);
      }
    }

    if (result.length === 0) {
      return sliceIfLimited(
        allProducts.filter((p) => !isExcluded(p.id)),
        limit,
      );
    }
  }

  return sliceIfLimited(result, limit);
}

function getDefaultProducts(allProducts, limit) {
  const withScore = allProducts
    .map((p) => ({
      product: p,
      score: (Number(p.rating) || 0) * 10 + (Number(p.sales) || 0),
    }))
    .sort((a, b) => b.score - a.score);
  return sliceIfLimited(
    withScore.map((x) => x.product),
    limit,
  );
}

module.exports = {
  getSimilarProducts,
  getRecommendationsByViewingHistory,
  getRecommendationsForProductDetail,
  getDefaultProducts,
};
