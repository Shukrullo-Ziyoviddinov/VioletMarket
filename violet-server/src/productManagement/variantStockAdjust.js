/**
 * Variant ombori: checkout decrement va qaytarish increment — bir xil pozitsiya.
 * cartService / markProductsAsSold circular dependency bo‘lmasligi uchun alohida.
 */

const { hasVariantStockData } = require("../utils/productStockRules");

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function optionNameMatches(name, label) {
  const target = normalizeLabel(label);
  if (!target) return false;
  if (typeof name === "string") return normalizeLabel(name) === target;
  if (name && typeof name === "object") {
    return [name.uz, name.ru].some((n) => normalizeLabel(n) === target);
  }
  return false;
}

function getMatchedColors(product, colorLabel) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const normalizedColor = normalizeLabel(colorLabel);
  if (!normalizedColor) return colors;
  return colors.filter((color) => optionNameMatches(color?.name, normalizedColor));
}

function toNonNegativeInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function getMapEntryQuantity(entryValue) {
  if (entryValue && typeof entryValue === "object" && !Array.isArray(entryValue)) {
    const qty = Number(entryValue.quantity);
    if (!Number.isFinite(qty)) return 0;
    return Math.max(0, Math.floor(qty));
  }
  return toNonNegativeInt(entryValue);
}

function setMapEntryQuantity(mapObj, key, nextQty) {
  if (!mapObj || key == null) return;
  const next = Math.max(0, Math.floor(Number(nextQty) || 0));
  if (mapObj[key] && typeof mapObj[key] === "object" && !Array.isArray(mapObj[key])) {
    mapObj[key].quantity = next;
  } else {
    mapObj[key] = next;
  }
}

function findMapKeyByLabel(mapObj, label) {
  if (!mapObj || typeof mapObj !== "object") return null;
  const target = normalizeLabel(label);
  if (!target) return null;
  for (const key of Object.keys(mapObj)) {
    if (normalizeLabel(key) === target) return key;
  }
  return null;
}

function getOptionLabel(option, labelField) {
  if (labelField && option && typeof option === "object") {
    return option[labelField];
  }
  if (option && typeof option === "object") {
    return option.name ?? option.size ?? "";
  }
  return option;
}

function scopedListAvailability(matchedColors, listField, labelField, variantValue) {
  if (!variantValue) return null;
  let total = 0;
  let found = false;
  for (const color of matchedColors) {
    const list = Array.isArray(color?.[listField]) ? color[listField] : [];
    for (const option of list) {
      const optionLabel = getOptionLabel(option, labelField);
      if (!optionNameMatches(optionLabel, variantValue)) continue;
      const quantity = Number(option?.quantity);
      if (!Number.isFinite(quantity)) continue;
      found = true;
      total += toNonNegativeInt(quantity);
    }
  }
  return found ? total : null;
}

function hasListQuantity(matchedColors, listField, labelField, variantValue) {
  return scopedListAvailability(matchedColors, listField, labelField, variantValue) != null;
}

function hasNonEmptyStockMap(stockMap) {
  if (!stockMap || typeof stockMap !== "object" || Array.isArray(stockMap)) {
    return false;
  }
  return Object.keys(stockMap).length > 0;
}

function normalizeVariant(variant = {}) {
  return {
    color: String(variant.color || "").trim(),
    size: String(variant.size || "").trim(),
    storage: String(variant.storage || "").trim(),
    model: String(variant.model || "").trim(),
  };
}

function hasVariantHint(variant = {}) {
  const v = normalizeVariant(variant);
  return Boolean(v.color || v.size || v.storage || v.model);
}

function adjustColorQuantities(matchedColors, delta) {
  const signed = Math.trunc(Number(delta) || 0);
  let remaining = Math.abs(signed);
  if (!remaining || !matchedColors.length) return;
  const adding = signed > 0;

  for (const color of matchedColors) {
    if (remaining <= 0) break;
    if (!Number.isFinite(Number(color?.quantity))) continue;
    const available = toNonNegativeInt(color.quantity);
    if (adding) {
      color.quantity = available + remaining;
      remaining = 0;
    } else {
      const take = Math.min(available, remaining);
      color.quantity = available - take;
      remaining -= take;
    }
  }
}

function adjustStockMap(matchedColors, fieldName, variantValue, delta) {
  if (!variantValue || !matchedColors.length) return;
  const signed = Math.trunc(Number(delta) || 0);
  let remaining = Math.abs(signed);
  if (!remaining) return;
  const adding = signed > 0;

  for (const color of matchedColors) {
    if (remaining <= 0) break;
    const mapObj = color?.[fieldName];
    const key = findMapKeyByLabel(mapObj, variantValue);
    if (key == null) continue;
    const available = getMapEntryQuantity(mapObj[key]);
    if (adding) {
      setMapEntryQuantity(mapObj, key, available + remaining);
      remaining = 0;
    } else {
      const take = Math.min(available, remaining);
      setMapEntryQuantity(mapObj, key, available - take);
      remaining -= take;
    }
  }
}

function adjustProductStockMap(product, fieldName, variantValue, delta) {
  if (!variantValue) return;
  const mapObj = product?.[fieldName];
  const key = findMapKeyByLabel(mapObj, variantValue);
  if (key == null) return;
  const available = getMapEntryQuantity(mapObj[key]);
  const signed = Math.trunc(Number(delta) || 0);
  const amount = Math.abs(signed);
  if (!amount) return;
  if (signed > 0) {
    setMapEntryQuantity(mapObj, key, available + amount);
  } else {
    setMapEntryQuantity(mapObj, key, Math.max(0, available - amount));
  }
}

function adjustOptionList(
  matchedColors,
  listField,
  labelField,
  variantValue,
  delta,
) {
  if (!variantValue || !matchedColors.length) return;
  const signed = Math.trunc(Number(delta) || 0);
  let remaining = Math.abs(signed);
  if (!remaining) return;
  const adding = signed > 0;

  for (const color of matchedColors) {
    if (remaining <= 0) break;
    const list = Array.isArray(color?.[listField]) ? color[listField] : [];
    for (const option of list) {
      if (remaining <= 0) break;
      const optionLabel = getOptionLabel(option, labelField);
      if (!optionNameMatches(optionLabel, variantValue)) continue;
      if (!Number.isFinite(Number(option?.quantity))) continue;
      const available = toNonNegativeInt(option.quantity);
      if (adding) {
        option.quantity = available + remaining;
        remaining = 0;
      } else {
        const take = Math.min(available, remaining);
        option.quantity = available - take;
        remaining -= take;
      }
    }
  }
}

/**
 * delta < 0 — checkout (kamaytirish), delta > 0 — qaytarish (oshirish).
 * Bir xil rang / o‘lcham / storage / model pozitsiyasiga ta’sir qiladi.
 */
function adjustVariantStock(product, variantRaw = {}, deltaRaw = 0) {
  const delta = Math.trunc(Number(deltaRaw) || 0);
  if (!product || !delta) return;

  const variant = normalizeVariant(variantRaw);
  const matchedColors = getMatchedColors(product, variant.color);

  if (matchedColors.length === 0) {
    adjustProductStockMap(product, "colorStock", variant.color, delta);
    adjustProductStockMap(product, "sizeStock", variant.size, delta);
    adjustProductStockMap(product, "storageStock", variant.storage, delta);
    adjustProductStockMap(product, "modelStock", variant.model, delta);
    return;
  }

  adjustColorQuantities(matchedColors, delta);
  adjustStockMap(matchedColors, "sizeStock", variant.size, delta);

  if (hasListQuantity(matchedColors, "storage", "size", variant.storage)) {
    adjustOptionList(matchedColors, "storage", "size", variant.storage, delta);
  } else {
    adjustStockMap(matchedColors, "storageStock", variant.storage, delta);
  }

  if (hasListQuantity(matchedColors, "models", "name", variant.model)) {
    adjustOptionList(matchedColors, "models", "name", variant.model, delta);
  } else {
    adjustStockMap(matchedColors, "modelStock", variant.model, delta);
  }
}

function applyVariantDecrement(product, variant, requestedQty = 1) {
  const qty = Math.max(0, Math.floor(Number(requestedQty) || 0));
  if (!qty) return;
  adjustVariantStock(product, variant, -qty);
}

function applyVariantIncrement(product, variant, requestedQty = 1) {
  const qty = Math.max(0, Math.floor(Number(requestedQty) || 0));
  if (!qty) return;
  adjustVariantStock(product, variant, qty);
}

function resolveVariantAvailability(product, variantRaw = {}) {
  const variant = normalizeVariant(variantRaw);
  const matchedColors = getMatchedColors(product, variant.color);
  const candidateAvailabilities = [];

  const scopedMapAvailability = (sourceList, fieldName, variantValue) => {
    if (!variantValue) return null;
    let total = 0;
    let found = false;
    for (const source of sourceList) {
      const key = findMapKeyByLabel(source?.[fieldName], variantValue);
      if (key == null) continue;
      found = true;
      total += getMapEntryQuantity(source[fieldName][key]);
    }
    return found ? total : null;
  };

  if (matchedColors.length > 0) {
    const colorQuantities = matchedColors
      .map((color) => Number(color?.quantity))
      .filter((n) => Number.isFinite(n));
    if (colorQuantities.length > 0) {
      candidateAvailabilities.push(
        colorQuantities.reduce((sum, current) => sum + toNonNegativeInt(current), 0),
      );
    }
  }

  const productSources = matchedColors.length > 0 ? matchedColors : [product];

  const colorAvailability = scopedMapAvailability([product], "colorStock", variant.color);
  if (colorAvailability != null) candidateAvailabilities.push(colorAvailability);
  const sizeAvailability = scopedMapAvailability(productSources, "sizeStock", variant.size);
  if (sizeAvailability != null) candidateAvailabilities.push(sizeAvailability);
  const storageAvailability =
    scopedListAvailability(matchedColors, "storage", "size", variant.storage) ??
    scopedMapAvailability(productSources, "storageStock", variant.storage);
  if (storageAvailability != null) candidateAvailabilities.push(storageAvailability);
  const modelAvailability =
    scopedListAvailability(matchedColors, "models", "name", variant.model) ??
    scopedMapAvailability(productSources, "modelStock", variant.model);
  if (modelAvailability != null) candidateAvailabilities.push(modelAvailability);

  if (candidateAvailabilities.length === 0) return null;
  return Math.min(...candidateAvailabilities);
}

function buildStockWritePayload(product) {
  return {
    colors: Array.isArray(product.colors) ? product.colors : [],
    colorStock: product.colorStock,
    sizeStock: product.sizeStock,
    storage: product.storage,
    storageStock: product.storageStock,
    models: product.models,
    modelStock: product.modelStock,
  };
}

module.exports = {
  hasVariantStockData,
  hasVariantHint,
  normalizeVariant,
  applyVariantDecrement,
  applyVariantIncrement,
  adjustVariantStock,
  resolveVariantAvailability,
  buildStockWritePayload,
  hasNonEmptyStockMap,
};
