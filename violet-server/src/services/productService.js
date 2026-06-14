const { Product } = require("../models");
const {
  decorateProductsWithFlashSaleMeta,
  decorateSingleProductWithFlashSaleMeta,
} = require("./flashSale/flashSaleSignalsService");
const {
  getSectionMetricsByProductIds,
  sortProductsBySectionRanking,
  attachGlobalRankingMeta,
} = require("./recommendation/recommendationRankingService");
const {
  buildProductDetailSalesProgressMeta,
  decorateWithProductDetailSalesProgressMeta,
} = require("./productDetail/productDetailSalesProgressService");

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

function decorateWithEffectiveQuantity(products) {
  return (Array.isArray(products) ? products : []).map((product) => ({
    ...product,
    effectiveQuantity: computeEffectiveQuantity(product),
  }));
}

function keepNewestProductPerId(products) {
  const seen = new Set();
  const unique = [];

  for (const product of Array.isArray(products) ? products : []) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function stripLegacyDeliveryInfo(product) {
  if (!product || typeof product !== "object") return product;
  const { deliveryInfo, ...rest } = product;
  return rest;
}

async function findAll() {
  const products = await Product.find().sort({ _id: -1 }).lean();
  const uniqueProducts = keepNewestProductPerId(products).map(stripLegacyDeliveryInfo);
  const decorated = await decorateProductsWithFlashSaleMeta(uniqueProducts);
  const withEffectiveQty = decorateWithEffectiveQuantity(decorated);
  const withDetailSalesMeta = decorateWithProductDetailSalesProgressMeta(withEffectiveQty);
  const metricRows = await getSectionMetricsByProductIds(withDetailSalesMeta.map((p) => p?.id));
  const withGlobalRankingMeta = attachGlobalRankingMeta(withDetailSalesMeta, metricRows);
  return sortProductsBySectionRanking(withGlobalRankingMeta, metricRows);
}

async function findByProductId(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  /** Bir xil `id` nechta bo‘lsa — eng eski `_id` bo‘yicha bittasi */
  const rows = await Product.find({ id: num }).sort({ _id: -1 }).limit(1).lean();
  const sanitized = stripLegacyDeliveryInfo(rows[0] || null);
  const decorated = await decorateSingleProductWithFlashSaleMeta(sanitized);
  if (!decorated) return null;
  const effectiveQuantity = computeEffectiveQuantity(decorated);
  return {
    ...decorated,
    effectiveQuantity,
    productDetailSalesMeta: buildProductDetailSalesProgressMeta({
      ...decorated,
      effectiveQuantity,
    }),
  };
}

async function createProduct(input) {
  const payload = { ...(input && typeof input === "object" ? input : {}) };
  delete payload.id; // qat'iy rejim: id faqat DB tomonidan beriladi
  delete payload.deliveryInfo; // deliveryInfo endi alohida kolleksiyada saqlanadi

  const created = await Product.create(payload);
  const doc = created.toObject ? created.toObject() : created;
  const decorated = await decorateSingleProductWithFlashSaleMeta(stripLegacyDeliveryInfo(doc));
  if (!decorated) return null;
  const effectiveQuantity = computeEffectiveQuantity(decorated);

  return {
    ...decorated,
    effectiveQuantity,
    productDetailSalesMeta: buildProductDetailSalesProgressMeta({
      ...decorated,
      effectiveQuantity,
    }),
  };
}

module.exports = {
  findAll,
  findByProductId,
  createProduct,
};
