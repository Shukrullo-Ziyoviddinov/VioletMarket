const { Product } = require("../models/product");
const { HttpError } = require("../utils/httpError");
const { recordCheckoutSales } = require("../services/recommendation/recommendationRankingService");
const {
  FLASH_CATEGORY_SECTION_KEY,
  isFlashCategoryActive,
} = require("../utils/flashCategoryProduct");

/**
 * Buyurtma tasdiqlanganda mahsulotlarni sotildi deb belgilash.
 * Hozir checkout dan chaqiriladi; keyin real to'lov / yetkazib berish adminkasidan ham shu funksiya ishlatiladi.
 */
async function markProductsAsSold({
  requestedByProductId,
  variantRequestsByProductId,
  productMap,
  hasVariantStockByProductId,
  applyVariantDecrement,
}) {
  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    let result;

    if (hasVariantStock) {
      result = await Product.updateOne(
        { id: productId },
        { $inc: { flashSaleSoldCount: requestedQty } },
      );
    } else {
      result = await Product.updateOne(
        { id: productId, quantity: { $gte: requestedQty } },
        { $inc: { quantity: -requestedQty, flashSaleSoldCount: requestedQty } },
      );
    }

    if (result.modifiedCount !== 1) {
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
          storageStock: product.storageStock,
          modelStock: product.modelStock,
        },
      },
    );
  }

  const rankingMetrics = [];
  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const product = productMap.get(productId);
    if (!product) continue;
    const sectionKey = String(product.categoryName || "").trim();
    if (!sectionKey) continue;
    rankingMetrics.push({
      productId,
      sectionKey,
      soldQty: requestedQty,
    });
    if (isFlashCategoryActive(product)) {
      rankingMetrics.push({
        productId,
        sectionKey: FLASH_CATEGORY_SECTION_KEY,
        soldQty: requestedQty,
      });
    }
  }
  await recordCheckoutSales(rankingMetrics);
}

module.exports = {
  markProductsAsSold,
};
