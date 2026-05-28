const { Product } = require("../../models/product");
const { getProductDisplayPrice } = require("../viewedAt/viewedAtHelpers");
const { parsePagination, parseSort, stripMongoMeta } = require("../../utils/paginationHelpers");
const { parseCategoryName } = require("./collectionHelpers");
const {
  getSectionMetricsByProductIds,
  sortProductsBySectionRanking,
} = require("../recommendation/recommendationRankingService");

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function sumListQuantity(list) {
  if (!Array.isArray(list)) return null;
  let total = 0;
  let found = false;
  for (const item of list) {
    const qty = toNonNegativeInt(item?.quantity);
    if (qty == null) continue;
    total += qty;
    found = true;
  }
  return found ? total : null;
}

function sumStockMapValues(stockMap) {
  if (!stockMap || typeof stockMap !== "object" || Array.isArray(stockMap)) return null;
  let total = 0;
  let found = false;
  for (const value of Object.values(stockMap)) {
    const qty = toNonNegativeInt(
      value && typeof value === "object" && !Array.isArray(value) ? value.quantity : value,
    );
    if (qty == null) continue;
    total += qty;
    found = true;
  }
  return found ? total : null;
}

function pickBestCandidate(candidates) {
  const values = (Array.isArray(candidates) ? candidates : [])
    .map((value) => {
      if (value == null || value === "") return null;
      const num = Number(value);
      if (!Number.isFinite(num)) return null;
      return Math.max(0, num);
    })
    .filter((value) => value != null);
  if (values.length === 0) return null;
  return Math.max(...values);
}

function computeEffectiveQuantity(product) {
  const rootVariantCandidate = pickBestCandidate([
    sumListQuantity(product?.models),
    sumListQuantity(product?.storage),
    sumStockMapValues(product?.modelStock),
    sumStockMapValues(product?.storageStock),
    sumStockMapValues(product?.sizeStock),
    sumStockMapValues(product?.colorStock),
  ]);

  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (colors.length > 0) {
    let total = 0;
    let found = false;
    for (const color of colors) {
      const colorVariantCandidate = pickBestCandidate([
        sumListQuantity(color?.models),
        sumListQuantity(color?.storage),
        sumStockMapValues(color?.modelStock),
        sumStockMapValues(color?.storageStock),
        sumStockMapValues(color?.sizeStock),
      ]);
      if (colorVariantCandidate != null) {
        total += colorVariantCandidate;
        found = true;
        continue;
      }
      const colorQty = toNonNegativeInt(color?.quantity);
      if (colorQty != null) {
        total += colorQty;
        found = true;
      }
    }
    if (found) return total;
  }

  if (rootVariantCandidate != null) return rootVariantCandidate;

  const fromQuantity = toNonNegativeInt(product?.quantity);
  if (fromQuantity != null) return fromQuantity;

  return 0;
}

function resolveSort(categoryName, sort) {
  if (sort !== "default") return sort;
  if (categoryName === "engArzonlare") return "price-asc";
  return "default";
}

function sortProducts(products, sort) {
  const list = [...products];
  if (sort === "price-asc") {
    list.sort((a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b));
  } else if (sort === "price-desc") {
    list.sort((a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a));
  }
  return list;
}

function keepNewestProductPerId(products) {
  const sortedByNewest = [...(Array.isArray(products) ? products : [])].sort((a, b) =>
    String(b?._id || "").localeCompare(String(a?._id || "")),
  );
  const seen = new Set();
  const unique = [];

  for (const product of sortedByNewest) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

async function getCollectionProducts(categoryNameRaw, query) {
  const categoryName = parseCategoryName(categoryNameRaw);
  const { page, limit, skip } = parsePagination(query);
  const sort = resolveSort(categoryName, parseSort(query?.sort));

  const allForCategory = keepNewestProductPerId(await Product.find({ categoryName }).lean()).map((p) => ({
    ...p,
    effectiveQuantity: computeEffectiveQuantity(p),
  }));
  const total = allForCategory.length;
  let sorted = sortProducts(allForCategory, sort);
  if (sort === "default") {
    const metricRows = await getSectionMetricsByProductIds(sorted.map((p) => p?.id));
    sorted = sortProductsBySectionRanking(sorted, metricRows);
  }
  const slice = sorted.slice(skip, skip + limit).map(stripMongoMeta);

  return {
    categoryName,
    products: slice,
    page,
    limit,
    total,
    hasMore: skip + slice.length < total,
    sort,
  };
}

module.exports = {
  getCollectionProducts,
};
