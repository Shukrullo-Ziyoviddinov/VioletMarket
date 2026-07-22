const { Product } = require("../models/product");
const { SellerAccount } = require("../models/sellerAccount");
const { HttpError } = require("../utils/httpError");
const { recordCheckoutSales } = require("../services/recommendation/recommendationRankingService");
const {
  FLASH_CATEGORY_SECTION_KEY,
  isFlashCategoryActive,
} = require("../utils/flashCategoryProduct");

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
 * Checkout: faqat ombor rezervi (qoldiq kamayadi).
 * «Sotildi» foizi / ranking — Topshirdim da recordProductSoldDisplayMetrics.
 */
async function reserveProductsOnCheckout({
  requestedByProductId,
  variantRequestsByProductId,
  productMap,
  hasVariantStockByProductId,
  applyVariantDecrement,
}) {
  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const product = productMap.get(productId) || productMap.get(Number(productId));
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    const rootQty = Number(product?.quantity);
    const hasRootQty = Number.isFinite(rootQty);

    // Detail sahifadagi qoldiq ko‘pincha `quantity` / effectiveQuantity dan.
    // Variant bo‘lsa ham root quantity bo‘lsa — rezerv qilamiz.
    if (hasRootQty) {
      const result = await Product.updateOne(
        { id: productId, quantity: { $gte: requestedQty } },
        { $inc: { quantity: -requestedQty } },
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
    }
  }

  for (const [productId, perProductVariantMap] of variantRequestsByProductId.entries()) {
    const product = productMap.get(productId);
    if (!product) continue;
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    if (!hasVariantStock) continue;
    for (const entry of perProductVariantMap.values()) {
      applyVariantDecrement(product, entry.variant, entry.requestedQty);
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
 * Topshirdim: flash «sotildi» foizi + ranking soldCount.
 * Ombor rezervi checkout da bo‘lgani uchun quantity yana kamaytirilmaydi.
 */
async function recordProductSoldDisplayMetrics(productQtyMap = new Map()) {
  const entries = [...productQtyMap.entries()].filter(
    ([, qty]) => Number(qty) > 0,
  );
  if (!entries.length) return;

  const productIds = entries.map(([productId]) => Number(productId));
  const products = await Product.find({ id: { $in: productIds } })
    .select("id categoryName flashSale")
    .lean();
  const productMap = new Map(products.map((row) => [Number(row.id), row]));

  const ops = [];
  const rankingMetrics = [];

  for (const [rawId, rawQty] of entries) {
    const productId = Number(rawId);
    const soldQty = Math.max(0, Math.floor(Number(rawQty) || 0));
    if (!productId || soldQty <= 0) continue;

    ops.push({
      updateOne: {
        filter: { id: productId },
        update: { $inc: { flashSaleSoldCount: soldQty } },
      },
    });

    const product = productMap.get(productId);
    const sectionKey = String(product?.categoryName || "").trim();
    if (!sectionKey) continue;

    rankingMetrics.push({ productId, sectionKey, soldQty });
    if (product && isFlashCategoryActive(product)) {
      rankingMetrics.push({
        productId,
        sectionKey: FLASH_CATEGORY_SECTION_KEY,
        soldQty,
      });
    }
  }

  if (ops.length) {
    await Product.bulkWrite(ops, { ordered: false });
  }
  await recordCheckoutSales(rankingMetrics);
}

/**
 * @deprecated Eski nom — checkout rezervi. Yangi kod reserveProductsOnCheckout ishlating.
 */
async function markProductsAsSold(args) {
  return reserveProductsOnCheckout(args);
}

module.exports = {
  reserveProductsOnCheckout,
  recordProductSoldDisplayMetrics,
  markProductsAsSold,
};
