const { CartItem } = require("../../models/cart");
const {
  DEFAULT_RULES,
  getFlashSaleRules,
} = require("./flashSaleRuleConfigService");

function toPositiveInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function sumListQuantity(list) {
  if (!Array.isArray(list)) return null;
  let total = 0;
  let found = false;
  for (const item of list) {
    const qty = toPositiveInt(item?.quantity, null);
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
    const qty = toPositiveInt(
      value && typeof value === "object" && !Array.isArray(value) ? value.quantity : value,
      null,
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

function resolveRemainingQuantity(product) {
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
      const colorQty = toPositiveInt(color?.quantity, null);
      if (colorQty != null) {
        total += colorQty;
        found = true;
      }
    }
    if (found) return total;
  }

  if (rootVariantCandidate != null) return rootVariantCandidate;
  return toPositiveInt(product?.quantity, 0);
}

function resolveTone(remainingQuantity, rules) {
  if (remainingQuantity < rules.lowStockThreshold) return "danger";
  if (remainingQuantity > rules.highStockThreshold) return "warning";
  return "normal";
}

function buildSignals({ remainingQuantity, soldCount, cartHeldCount }, rules) {
  const signals = [];

  if (soldCount >= rules.minSoldCount && remainingQuantity < rules.lowStockThreshold) {
    signals.push({
      type: "low_stock_critical",
      tone: "danger",
      icon: "bx bxs-package",
      text: `Faqat ${remainingQuantity} ta qoldi`,
      highlightValue: remainingQuantity,
      priority: 300,
    });
  } else if (soldCount >= rules.minSoldCount && remainingQuantity > rules.highStockThreshold) {
    signals.push({
      type: "low_stock_notice",
      tone: "warning",
      icon: "bx bx-package",
      text: `Oxirgi ${remainingQuantity} ta qoldi`,
      highlightValue: remainingQuantity,
      priority: 200,
    });
  }

  if (cartHeldCount >= rules.minCartUsers) {
    signals.push({
      type: "in_cart_popular",
      tone: "info",
      icon: "bx bx-cart",
      text: `Bugun ${cartHeldCount} marta savatchaga qo'shildi`,
      highlightValue: cartHeldCount,
      priority: 250,
    });
  }

  return signals.sort((a, b) => b.priority - a.priority);
}

function buildFlashSaleMeta(product, cartHeldCount, rules = DEFAULT_RULES) {
  const normalizedRules = {
    ...DEFAULT_RULES,
    ...(rules || {}),
  };
  const remainingQuantity = resolveRemainingQuantity(product);
  const soldCount = toPositiveInt(product?.flashSaleSoldCount);
  const reservedQuantity = toPositiveInt(product?.reservedQuantity);
  const inCartCount = toPositiveInt(cartHeldCount);
  const signals = buildSignals({
    remainingQuantity,
    soldCount,
    cartHeldCount: inCartCount,
  }, normalizedRules);
  const autoFlashEnabled = normalizedRules.active && signals.length > 0 && remainingQuantity > 0;
  const flashSaleActive = autoFlashEnabled;
  // reservedQuantity: checkout bandi — sold % faqat Topshirdim da o‘zgaradi
  const totalForProgress = remainingQuantity + soldCount + reservedQuantity;
  const soldPercent =
    totalForProgress > 0
      ? Math.max(0, Math.min(100, Math.round((soldCount / totalForProgress) * 100)))
      : 0;
  const tone = resolveTone(remainingQuantity, normalizedRules);

  return {
    flashSaleActive,
    adminFlashEnabled: false,
    autoFlashEnabled,
    remainingQuantity,
    soldCount,
    inCartCount,
    soldPercent,
    tone,
    signals,
    rotateSignals: signals.length > 1,
    rotateEveryMs: normalizedRules.rotateEveryMs,
  };
}

async function getCartHeldCountMap(productIds) {
  const ids = (Array.isArray(productIds) ? productIds : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) return new Map();

  const rows = await CartItem.aggregate([
    { $match: { productId: { $in: ids } } },
    { $group: { _id: { productId: "$productId", userId: "$userId" } } },
    { $group: { _id: "$_id.productId", totalInCarts: { $sum: 1 } } },
  ]);

  return new Map(
    rows.map((row) => [Number(row._id), toPositiveInt(row.totalInCarts)]),
  );
}

async function decorateProductsWithFlashSaleMeta(products) {
  const list = Array.isArray(products) ? products : [];
  const productIds = list.map((p) => p?.id);
  const [cartHeldCountMap, rules] = await Promise.all([
    getCartHeldCountMap(productIds),
    getFlashSaleRules(),
  ]);

  return list.map((product) => {
    const productId = Number(product?.id);
    const inCartCount = cartHeldCountMap.get(productId) || 0;
    return {
      ...product,
      flashSaleMeta: buildFlashSaleMeta(product, inCartCount, rules),
    };
  });
}

async function decorateSingleProductWithFlashSaleMeta(product) {
  if (!product) return null;
  const [cartHeldCountMap, rules] = await Promise.all([
    getCartHeldCountMap([product.id]),
    getFlashSaleRules(),
  ]);
  const inCartCount = cartHeldCountMap.get(Number(product.id)) || 0;
  return {
    ...product,
    flashSaleMeta: buildFlashSaleMeta(product, inCartCount, rules),
  };
}

module.exports = {
  DEFAULT_RULES,
  buildFlashSaleMeta,
  decorateProductsWithFlashSaleMeta,
  decorateSingleProductWithFlashSaleMeta,
};
