const { ProductSectionMetric } = require("../../models/productSectionMetric");

function toNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function normalizeSectionKey(value) {
  return String(value || "").trim();
}

function buildMetricIndex(rows) {
  const index = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const productId = Number(row?.productId);
    const sectionKey = normalizeSectionKey(row?.sectionKey);
    if (!Number.isFinite(productId) || !sectionKey) continue;
    index.set(`${productId}::${sectionKey}`, {
      soldCount: toNonNegativeInt(row?.soldCount, 0),
      lastSoldAtMs: new Date(row?.lastSoldAt || 0).getTime() || 0,
    });
  }
  return index;
}

function isOutOfStock(product) {
  const qty = Number(product?.effectiveQuantity);
  return Number.isFinite(qty) ? qty <= 0 : false;
}

function toNonNegativeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

/**
 * Sotuv balli:
 * - Base: sold/(sold+effective+1) => katta stock'lar monopol bo'lib ketmasin
 * - Recency bonus: oxirgi sotilgan mahsulotga kichik qo'shimcha
 */
function computeRankingScore(product, metric) {
  const soldCount = toNonNegativeNumber(metric?.soldCount, 0);
  const effectiveQty = toNonNegativeNumber(product?.effectiveQuantity, 0);

  const base = soldCount / (soldCount + effectiveQty + 1);

  const lastSoldAtMs = Number(metric?.lastSoldAtMs) || 0;
  if (!lastSoldAtMs) return base;

  const ageHours = Math.max(0, (Date.now() - lastSoldAtMs) / (1000 * 60 * 60));
  const recencyBonus = Math.max(0, 0.12 - ageHours * 0.01); // ~12 soatgacha sekin so'nadi
  return base + recencyBonus;
}

function sortProductsBySectionRanking(products, metricsRows) {
  const list = Array.isArray(products) ? products : [];
  if (list.length <= 1) return list;

  const metricIndex = buildMetricIndex(metricsRows);
  const bySection = new Map();

  for (let i = 0; i < list.length; i += 1) {
    const product = list[i];
    const sectionKey = normalizeSectionKey(product?.categoryName);
    const section = sectionKey || "__unknown__";
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ idx: i, product });
  }

  const out = [...list];
  for (const entries of bySection.values()) {
    const sorted = [...entries].sort((a, b) => {
      const aOut = isOutOfStock(a.product);
      const bOut = isOutOfStock(b.product);
      if (aOut !== bOut) return aOut ? 1 : -1; // OOS oxiriga tushadi.

      const aKey = `${Number(a.product?.id)}::${normalizeSectionKey(a.product?.categoryName)}`;
      const bKey = `${Number(b.product?.id)}::${normalizeSectionKey(b.product?.categoryName)}`;
      const aMetric = metricIndex.get(aKey);
      const bMetric = metricIndex.get(bKey);

      const aSold = toNonNegativeNumber(aMetric?.soldCount, 0);
      const bSold = toNonNegativeNumber(bMetric?.soldCount, 0);
      if (aSold !== bSold) return bSold - aSold;

      const aScore = computeRankingScore(a.product, aMetric);
      const bScore = computeRankingScore(b.product, bMetric);
      if (aScore !== bScore) return bScore - aScore;

      const aLast = aMetric?.lastSoldAtMs ?? 0;
      const bLast = bMetric?.lastSoldAtMs ?? 0;
      if (aLast !== bLast) return bLast - aLast;

      return a.idx - b.idx;
    });

    for (let i = 0; i < entries.length; i += 1) {
      out[entries[i].idx] = sorted[i].product;
    }
  }

  return out;
}

async function getSectionMetricsByProductIds(productIds) {
  const ids = (Array.isArray(productIds) ? productIds : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  if (ids.length === 0) return [];
  return ProductSectionMetric.find({ productId: { $in: ids } })
    .select("productId sectionKey soldCount lastSoldAt")
    .lean();
}

async function recordCheckoutSales(metrics) {
  const list = Array.isArray(metrics) ? metrics : [];
  if (list.length === 0) return;

  const ops = [];
  const now = new Date();
  for (const row of list) {
    const productId = Number(row?.productId);
    const sectionKey = normalizeSectionKey(row?.sectionKey);
    const soldQty = toNonNegativeInt(row?.soldQty, 0);
    if (!Number.isFinite(productId) || !sectionKey || soldQty <= 0) continue;
    ops.push({
      updateOne: {
        filter: { productId, sectionKey },
        update: {
          $inc: { soldCount: soldQty },
          $set: { lastSoldAt: now },
        },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await ProductSectionMetric.bulkWrite(ops, { ordered: false });
  }
}

module.exports = {
  getSectionMetricsByProductIds,
  sortProductsBySectionRanking,
  recordCheckoutSales,
};
