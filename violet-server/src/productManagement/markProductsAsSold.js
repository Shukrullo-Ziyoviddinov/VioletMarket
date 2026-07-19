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
 * Buyurtma tasdiqlanganda mahsulotlarni sotildi deb belgilash (ombor/qoldiq).
 * Hozir checkout dan chaqiriladi (stock rezerv).
 * Mijozga topshirish (tracking delivered) endi kuryer "Topshirdim" / keyin asosiy admindan.
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
  await incrementSellerOrderCounts(requestedByProductId, productMap);
}

module.exports = {
  markProductsAsSold,
};
