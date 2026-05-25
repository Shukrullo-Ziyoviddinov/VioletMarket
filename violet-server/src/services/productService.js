const { Product } = require("../models");
const {
  decorateProductsWithFlashSaleMeta,
  decorateSingleProductWithFlashSaleMeta,
} = require("./flashSale/flashSaleSignalsService");

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
    const qty = toNonNegativeInt(value);
    if (qty == null) continue;
    total += qty;
    found = true;
  }
  return found ? total : null;
}

function computeEffectiveQuantity(product) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (colors.length > 0) {
    let total = 0;
    let found = false;
    for (const color of colors) {
      const fromColorModels = sumListQuantity(color?.models);
      if (fromColorModels != null) {
        total += fromColorModels;
        found = true;
        continue;
      }
      const fromColorStorage = sumListQuantity(color?.storage);
      if (fromColorStorage != null) {
        total += fromColorStorage;
        found = true;
        continue;
      }
      const fromModelStock = sumStockMapValues(color?.modelStock);
      if (fromModelStock != null) {
        total += fromModelStock;
        found = true;
        continue;
      }
      const fromStorageStock = sumStockMapValues(color?.storageStock);
      if (fromStorageStock != null) {
        total += fromStorageStock;
        found = true;
        continue;
      }
      const fromSizeStock = sumStockMapValues(color?.sizeStock);
      if (fromSizeStock != null) {
        total += fromSizeStock;
        found = true;
        continue;
      }
      const fromColorQuantity = toNonNegativeInt(color?.quantity);
      if (fromColorQuantity != null) {
        total += fromColorQuantity;
        found = true;
      }
    }
    if (found) return total;
  }

  const fromModels = sumListQuantity(product?.models);
  if (fromModels != null) return fromModels;

  const fromStorage = sumListQuantity(product?.storage);
  if (fromStorage != null) return fromStorage;

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

async function findAll() {
  const products = await Product.find().sort({ _id: -1 }).lean();
  const uniqueProducts = keepNewestProductPerId(products);
  const decorated = await decorateProductsWithFlashSaleMeta(uniqueProducts);
  return decorateWithEffectiveQuantity(decorated);
}

async function findByProductId(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  /** Bir xil `id` nechta bo‘lsa — eng eski `_id` bo‘yicha bittasi */
  const rows = await Product.find({ id: num }).sort({ _id: -1 }).limit(1).lean();
  const decorated = await decorateSingleProductWithFlashSaleMeta(rows[0] || null);
  if (!decorated) return null;
  return {
    ...decorated,
    effectiveQuantity: computeEffectiveQuantity(decorated),
  };
}

module.exports = {
  findAll,
  findByProductId,
};
