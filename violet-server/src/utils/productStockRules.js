const STOCK_MAP_FIELDS = ["modelStock", "storageStock", "sizeStock", "colorStock"];

function isObjectRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function toNonNegativeInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.floor(num));
}

function hasStockMapData(source) {
  return STOCK_MAP_FIELDS.some((field) => {
    const map = source?.[field];
    return isObjectRecord(map) && Object.keys(map).length > 0;
  });
}

function hasListVariantData(source) {
  return (
    (Array.isArray(source?.models) && source.models.length > 0) ||
    (Array.isArray(source?.storage) && source.storage.length > 0)
  );
}

function hasVariantStockData(product) {
  const rootHasVariant = hasStockMapData(product) || hasListVariantData(product);
  if (rootHasVariant) return true;

  const colors = Array.isArray(product?.colors) ? product.colors : [];
  return colors.some((color) => {
    const colorOwnQty = toNonNegativeInt(color?.quantity);
    return (
      colorOwnQty != null ||
      hasStockMapData(color) ||
      hasListVariantData(color)
    );
  });
}

function normalizeStockEntry(entry, fallbackPrice, fallbackOriginalPrice) {
  if (isObjectRecord(entry)) {
    const quantity = toNonNegativeInt(entry.quantity);
    if (quantity == null) return null;
    return {
      quantity,
      price: entry.price ?? fallbackPrice ?? null,
      originalPrice: entry.originalPrice ?? fallbackOriginalPrice ?? null,
    };
  }

  const quantity = toNonNegativeInt(entry);
  if (quantity == null) return null;
  return {
    quantity,
    price: fallbackPrice ?? null,
    originalPrice: fallbackOriginalPrice ?? null,
  };
}

function normalizeStockMapsInPlace(source, fallbackPrice, fallbackOriginalPrice, issues, pathPrefix) {
  for (const field of STOCK_MAP_FIELDS) {
    const map = source?.[field];
    if (!isObjectRecord(map)) continue;

    const normalizedMap = {};
    for (const [key, value] of Object.entries(map)) {
      const normalized = normalizeStockEntry(value, fallbackPrice, fallbackOriginalPrice);
      if (!normalized) {
        issues.push(`${pathPrefix}.${field}.${key}`);
        continue;
      }
      normalizedMap[key] = normalized;
    }
    source[field] = normalizedMap;
  }
}

function normalizeProductStockShape(productLike) {
  const issues = [];
  if (!isObjectRecord(productLike)) return issues;

  const rootPrice = productLike.price ?? null;
  const rootOriginalPrice = productLike.originalPrice ?? null;

  const quantity = toNonNegativeInt(productLike.quantity);
  if (quantity != null) {
    productLike.quantity = quantity;
  }

  normalizeStockMapsInPlace(productLike, rootPrice, rootOriginalPrice, issues, "product");

  const colors = Array.isArray(productLike.colors) ? productLike.colors : [];
  colors.forEach((color, index) => {
    if (!isObjectRecord(color)) return;
    const colorQty = toNonNegativeInt(color.quantity);
    if (colorQty != null) color.quantity = colorQty;

    const fallbackPrice = color.price ?? rootPrice ?? null;
    const fallbackOriginalPrice = color.originalPrice ?? rootOriginalPrice ?? null;
    normalizeStockMapsInPlace(color, fallbackPrice, fallbackOriginalPrice, issues, `product.colors[${index}]`);
  });

  return issues;
}

function validateProductStockRules(productLike) {
  const errors = [];
  if (!isObjectRecord(productLike)) return errors;

  const hasProductQuantity = toNonNegativeInt(productLike.quantity) != null;
  const isVariantProduct = hasVariantStockData(productLike);

  if (isVariantProduct && hasProductQuantity) {
    errors.push(
      "Variantli mahsulotda tashqi product.quantity bo'lmasligi kerak. Stock faqat variant ichidan olinadi.",
    );
  }

  if (!isVariantProduct && !hasProductQuantity) {
    errors.push(
      "Variantsiz mahsulotda product.quantity bo'lishi shart.",
    );
  }

  return errors;
}

module.exports = {
  STOCK_MAP_FIELDS,
  hasVariantStockData,
  normalizeProductStockShape,
  toNonNegativeInt,
  validateProductStockRules,
};
