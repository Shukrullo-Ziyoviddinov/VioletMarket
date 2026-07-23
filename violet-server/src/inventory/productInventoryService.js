/**
 * Ombor (inventory) — bitta kirish nuqtasi.
 *
 * Zanjir:
 *   reserveOnCheckout   → checkout (−qty, +reserved)
 *   keepReserved        → Javob bermadi (Product o‘zgarmaydi)
 *   releaseToWarehouse  → oddiy qaytarish / Qayta aktiv (+qty, −reserved)
 *   discardReserved     → Yaroqsiz (−reserved, ombor/algoritmga tegmaydi)
 *   reReserveForCourier → qayta kuryerga (release aksini)
 *
 * Variant ± : variantStockAdjust.js
 */

const { Product } = require("../models/product");
const { SellerAccount } = require("../models/sellerAccount");
const { HttpError } = require("../utils/httpError");
const {
  applyVariantIncrement,
  applyVariantDecrement,
  hasVariantHint,
  hasVariantStockData,
  normalizeVariant,
  buildStockWritePayload,
} = require("../productManagement/variantStockAdjust");

async function incrementSellerOrderCounts(requestedByProductId, productMap) {
  const incrementsBySeller = new Map();

  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const product = productMap.get(Number(productId)) ?? productMap.get(productId);
    const sellerId = String(product?.sellerId ?? "").trim();
    if (!sellerId) continue;
    incrementsBySeller.set(
      sellerId,
      (incrementsBySeller.get(sellerId) || 0) + requestedQty,
    );
  }

  if (incrementsBySeller.size === 0) return;

  const ops = [];
  for (const [sellerId, qty] of incrementsBySeller.entries()) {
    ops.push({
      updateOne: {
        filter: { id: sellerId },
        update: { $inc: { orderCount: qty } },
      },
    });
  }

  await SellerAccount.bulkWrite(ops, { ordered: false });
}

/**
 * Checkout: ombor rezervi (qoldiq kamayadi, reservedQuantity oshadi).
 */
async function reserveOnCheckout({
  requestedByProductId,
  variantRequestsByProductId,
  productMap,
  hasVariantStockByProductId,
  applyVariantDecrement: applyDecrement = applyVariantDecrement,
}) {
  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const product = productMap.get(productId) || productMap.get(Number(productId));
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    const rootQty = Number(product?.quantity);
    const hasRootQty = Number.isFinite(rootQty);

    if (hasRootQty) {
      const result = await Product.updateOne(
        { id: productId, quantity: { $gte: requestedQty } },
        { $inc: { quantity: -requestedQty, reservedQuantity: requestedQty } },
      );
      if (result.modifiedCount !== 1 && !hasVariantStock) {
        throw new HttpError(
          409,
          `Mahsulot qoldig'i yangilash vaqtida o'zgardi: ${productId}`,
          "INSUFFICIENT_STOCK",
          [{ productId, requestedQty }],
        );
      }
    } else if (!hasVariantStock) {
      throw new HttpError(
        409,
        `Mahsulot qoldig'i yangilash vaqtida o'zgardi: ${productId}`,
        "INSUFFICIENT_STOCK",
        [{ productId, requestedQty }],
      );
    } else {
      await Product.updateOne(
        { id: productId },
        { $inc: { reservedQuantity: requestedQty } },
      );
    }
  }

  for (const [productId, perProductVariantMap] of variantRequestsByProductId.entries()) {
    const product = productMap.get(productId);
    if (!product) continue;
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    if (!hasVariantStock) continue;
    for (const entry of perProductVariantMap.values()) {
      applyDecrement(product, entry.variant, entry.requestedQty);
    }
    await Product.updateOne(
      { id: productId },
      {
        $set: {
          colors: Array.isArray(product.colors) ? product.colors : [],
          colorStock: product.colorStock,
          sizeStock: product.sizeStock,
          storage: product.storage,
          storageStock: product.storageStock,
          models: product.models,
          modelStock: product.modelStock,
        },
      },
    );
  }

  await incrementSellerOrderCounts(requestedByProductId, productMap);
}

/**
 * Javob bermadi: mijoz rezervi saqlanadi — Product yozilmaydi.
 */
async function keepReserved(productIdRaw, qtyRaw = 1, variantRaw = {}) {
  const productId = Number(productIdRaw);
  const qty = Math.max(1, Math.floor(Number(qtyRaw) || 1));
  return {
    kept: true,
    productId: Number.isFinite(productId) ? productId : 0,
    qty,
    variant: normalizeVariant(variantRaw),
  };
}

/**
 * Yaroqsiz: rezervni yechadi, ombor quantity / variant qaytmaydi.
 * Sotildi / ranking chaqirilmaydi — shunchaki yo‘qolgan rezerv.
 */
async function discardReserved(productIdRaw, qtyRaw = 1, _variantRaw = {}) {
  const productId = Number(productIdRaw);
  const qty = Math.max(1, Math.floor(Number(qtyRaw) || 1));
  if (!Number.isFinite(productId) || productId <= 0) return;

  const row = await Product.findOne({ id: productId })
    .select("reservedQuantity")
    .lean();
  if (!row) return;

  const currentReserved = Math.max(0, Number(row.reservedQuantity) || 0);
  await Product.updateOne(
    { id: productId },
    { $set: { reservedQuantity: Math.max(0, currentReserved - qty) } },
  );
}

/**
 * Oddiy qaytarish / Qayta aktiv: rezervni ochish + omborga +qty.
 */
async function releaseToWarehouse(productIdRaw, qtyRaw = 1, variantRaw = {}) {
  const productId = Number(productIdRaw);
  const qty = Math.max(1, Math.floor(Number(qtyRaw) || 1));
  if (!Number.isFinite(productId) || productId <= 0) return;

  const row = await Product.findOne({ id: productId }).lean();
  if (!row) return;

  const working = JSON.parse(JSON.stringify(row));
  const variant = normalizeVariant(variantRaw);

  const currentReserved = Math.max(0, Number(working.reservedQuantity) || 0);
  const $set = {
    reservedQuantity: Math.max(0, currentReserved - qty),
  };

  const rootQty = Number(working.quantity);
  if (Number.isFinite(rootQty)) {
    $set.quantity = Math.max(0, rootQty) + qty;
  }

  if (hasVariantStockData(working) && hasVariantHint(variant)) {
    applyVariantIncrement(working, variant, qty);
    Object.assign($set, buildStockWritePayload(working));
  }

  await Product.updateOne({ id: productId }, { $set });
}

/**
 * Qayta kuryerga: ombordan yana rezerv (release aksini).
 */
async function reReserveForCourier(productIdRaw, qtyRaw = 1, variantRaw = {}) {
  const productId = Number(productIdRaw);
  const qty = Math.max(1, Math.floor(Number(qtyRaw) || 1));
  if (!Number.isFinite(productId) || productId <= 0) return;

  const row = await Product.findOne({ id: productId }).lean();
  if (!row) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const working = JSON.parse(JSON.stringify(row));
  const variant = normalizeVariant(variantRaw);
  const currentReserved = Math.max(0, Number(working.reservedQuantity) || 0);
  const $set = {
    reservedQuantity: currentReserved + qty,
  };

  const rootQty = Number(working.quantity);
  if (Number.isFinite(rootQty)) {
    if (rootQty < qty) {
      throw new HttpError(
        409,
        "Omborda yetarli mahsulot yo‘q",
        "INSUFFICIENT_STOCK",
      );
    }
    $set.quantity = rootQty - qty;
  }

  if (hasVariantStockData(working) && hasVariantHint(variant)) {
    applyVariantDecrement(working, variant, qty);
    Object.assign($set, buildStockWritePayload(working));
  }

  await Product.updateOne({ id: productId }, { $set });
}

module.exports = {
  reserveOnCheckout,
  keepReserved,
  discardReserved,
  releaseToWarehouse,
  reReserveForCourier,
};
