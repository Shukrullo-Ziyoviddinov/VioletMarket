const { Product } = require("../../models/product");
const { recordCheckoutSales } = require("../../services/recommendation/recommendationRankingService");
const {
  FLASH_CATEGORY_SECTION_KEY,
  isFlashCategoryActive,
} = require("../../utils/flashCategoryProduct");

/**
 * Display metrics only (flash «sotildi» foizi + ranking soldCount).
 * SellerSoldItem / SellerSale yozmaydi.
 * Faqat live recordSalesOnDelivery chaqiradi — backfill BUNDAY QILMASIN (ikkilanish).
 * Ombor rezervi checkout da — quantity yana kamaytirilmaydi.
 */
async function recordProductSoldDisplayMetrics(productQtyMap = new Map()) {
  const entries = [...productQtyMap.entries()].filter(
    ([, qty]) => Number(qty) > 0,
  );
  if (!entries.length) return;

  const productIds = entries.map(([productId]) => Number(productId));
  const products = await Product.find({ id: { $in: productIds } })
    .select("id categoryName flashSale flashSaleSoldCount reservedQuantity")
    .lean();
  const productMap = new Map(products.map((row) => [Number(row.id), row]));

  const ops = [];
  const rankingMetrics = [];

  for (const [rawId, rawQty] of entries) {
    const productId = Number(rawId);
    const soldQty = Math.max(0, Math.floor(Number(rawQty) || 0));
    if (!productId || soldQty <= 0) continue;

    const product = productMap.get(productId);
    const currentSold = Math.max(0, Number(product?.flashSaleSoldCount) || 0);
    const currentReserved = Math.max(0, Number(product?.reservedQuantity) || 0);

    ops.push({
      updateOne: {
        filter: { id: productId },
        update: {
          $set: {
            flashSaleSoldCount: currentSold + soldQty,
            reservedQuantity: Math.max(0, currentReserved - soldQty),
          },
        },
      },
    });

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

module.exports = {
  recordProductSoldDisplayMetrics,
};
