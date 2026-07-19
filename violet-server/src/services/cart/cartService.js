const { CartItem } = require("../../models/cart");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const {
  markProductsAsSold,
  buildPostOrderReviewPayload,
  recordCartPayment,
} = require("../../productManagement");
const {
  generateInitialUrgencyStock,
  buildNextShowAt,
  buildUrgencyDurationMs,
  buildUrgencyEndsAt,
  toClientUrgencyNextShowAt,
} = require("./cartUrgencyService");

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

function normalizeLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function getProductTitleText(title, fallback) {
  if (typeof title === "string" && title.trim()) return title;
  if (title && typeof title === "object") {
    if (typeof title.uz === "string" && title.uz.trim()) return title.uz;
    if (typeof title.ru === "string" && title.ru.trim()) return title.ru;
  }
  return String(fallback || "Mahsulot");
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

function findMapKeyByLabel(mapObj, label) {
  if (!mapObj || typeof mapObj !== "object") return null;
  const target = normalizeLabel(label);
  if (!target) return null;
  const keys = Object.keys(mapObj);
  for (const key of keys) {
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

function resolveVariantAvailability(product, variant) {
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

function consumeFromColorQuantities(matchedColors, requestedQty) {
  let remaining = Math.max(0, requestedQty);
  for (const color of matchedColors) {
    if (remaining <= 0) break;
    const available = Number(color?.quantity);
    if (!Number.isFinite(available)) continue;
    const safeAvailable = toNonNegativeInt(available);
    const take = Math.min(safeAvailable, remaining);
    color.quantity = safeAvailable - take;
    remaining -= take;
  }
}

function consumeFromStockMap(matchedColors, fieldName, variantValue, requestedQty) {
  if (!variantValue) return;
  let remaining = Math.max(0, requestedQty);
  for (const color of matchedColors) {
    if (remaining <= 0) break;
    const mapObj = color?.[fieldName];
    const key = findMapKeyByLabel(mapObj, variantValue);
    if (key == null) continue;
    const available = getMapEntryQuantity(mapObj[key]);
    const take = Math.min(available, remaining);
    if (mapObj[key] && typeof mapObj[key] === "object" && !Array.isArray(mapObj[key])) {
      mapObj[key].quantity = available - take;
    } else {
      mapObj[key] = available - take;
    }
    remaining -= take;
  }
}

function consumeFromProductStockMap(product, fieldName, variantValue, requestedQty) {
  if (!variantValue) return;
  const mapObj = product?.[fieldName];
  const key = findMapKeyByLabel(mapObj, variantValue);
  if (key == null) return;
  const available = getMapEntryQuantity(mapObj[key]);
  const next = Math.max(0, available - Math.max(0, requestedQty));
  if (mapObj[key] && typeof mapObj[key] === "object" && !Array.isArray(mapObj[key])) {
    mapObj[key].quantity = next;
  } else {
    mapObj[key] = next;
  }
}

function consumeFromOptionList(
  matchedColors,
  listField,
  labelField,
  variantValue,
  requestedQty,
) {
  if (!variantValue) return;
  let remaining = Math.max(0, requestedQty);

  for (const color of matchedColors) {
    if (remaining <= 0) break;
    const list = Array.isArray(color?.[listField]) ? color[listField] : [];
    for (const option of list) {
      if (remaining <= 0) break;
      const optionLabel = getOptionLabel(option, labelField);
      if (!optionNameMatches(optionLabel, variantValue)) continue;
      const quantity = Number(option?.quantity);
      if (!Number.isFinite(quantity)) continue;
      const available = toNonNegativeInt(quantity);
      const take = Math.min(available, remaining);
      option.quantity = available - take;
      remaining -= take;
    }
  }
}

function applyVariantDecrement(product, variant, requestedQty) {
  const matchedColors = getMatchedColors(product, variant.color);
  if (matchedColors.length === 0) {
    consumeFromProductStockMap(product, "colorStock", variant.color, requestedQty);
    consumeFromProductStockMap(product, "sizeStock", variant.size, requestedQty);
    consumeFromProductStockMap(product, "storageStock", variant.storage, requestedQty);
    consumeFromProductStockMap(product, "modelStock", variant.model, requestedQty);
    return;
  }
  consumeFromColorQuantities(matchedColors, requestedQty);
  consumeFromStockMap(matchedColors, "sizeStock", variant.size, requestedQty);
  if (hasListQuantity(matchedColors, "storage", "size", variant.storage)) {
    consumeFromOptionList(matchedColors, "storage", "size", variant.storage, requestedQty);
  } else {
    consumeFromStockMap(matchedColors, "storageStock", variant.storage, requestedQty);
  }
  if (hasListQuantity(matchedColors, "models", "name", variant.model)) {
    consumeFromOptionList(matchedColors, "models", "name", variant.model, requestedQty);
  } else {
    consumeFromStockMap(matchedColors, "modelStock", variant.model, requestedQty);
  }
}

function hasVariantStockData(product) {
  if (Array.isArray(product?.models) && product.models.length > 0) return true;
  if (Array.isArray(product?.storage) && product.storage.length > 0) return true;
  if (product?.colorStock && typeof product.colorStock === "object") return true;
  if (product?.modelStock && typeof product.modelStock === "object") return true;
  if (product?.storageStock && typeof product.storageStock === "object") return true;
  if (product?.sizeStock && typeof product.sizeStock === "object") return true;

  const colors = Array.isArray(product?.colors) ? product.colors : [];
  for (const color of colors) {
    if (!color || typeof color !== "object") continue;
    if (Array.isArray(color.models) && color.models.length > 0) return true;
    if (Array.isArray(color.storage) && color.storage.length > 0) return true;
    if (color.modelStock && typeof color.modelStock === "object") return true;
    if (color.storageStock && typeof color.storageStock === "object") return true;
    if (color.sizeStock && typeof color.sizeStock === "object") return true;
    if (Number.isFinite(Number(color.quantity))) return true;
  }
  return false;
}

async function pickDistinctUrgencyStock(userId, excludeItemId = null) {
  const query = { userId };
  if (excludeItemId) {
    query._id = { $ne: excludeItemId };
  }

  const rows = await CartItem.find(query).select("urgencyStockLeft").lean();
  const used = new Set(
    rows
      .map((row) => Number(row.urgencyStockLeft))
      .filter((n) => Number.isFinite(n) && n >= 3 && n <= 6),
  );

  const candidates = [3, 4, 5, 6].filter((n) => !used.has(n));
  if (candidates.length === 0) {
    return generateInitialUrgencyStock();
  }
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

function mapItemToClient(doc) {
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    cartItemId: String(row._id),
    id: row.productId,
    title: row.title,
    price: row.price,
    originalPrice: row.originalPrice,
    color: row.color || "",
    size: row.size || "",
    storage: row.storage || "",
    model: row.model || "",
    image: row.image,
    quantity: row.quantity,
    countries: row.countries || [],
    weight: row.weight ?? 300,
    urgencyStockLeft: Number.isFinite(row.urgencyStockLeft)
      ? row.urgencyStockLeft
      : 3,
    urgencyNextShowAt: toClientUrgencyNextShowAt(row.urgencyNextShowAt),
    urgencyEndsAt: toClientUrgencyNextShowAt(row.urgencyEndsAt),
    urgencyDurationMs: Number.isFinite(row.urgencyDurationMs)
      ? row.urgencyDurationMs
      : null,
  };
}

async function getCartForUser(userId) {
  const items = await CartItem.find({ userId }).sort({ createdAt: -1 });
  for (const item of items) {
    let changed = false;

    if (!Number.isFinite(item.urgencyDurationMs)) {
      item.urgencyDurationMs = buildUrgencyDurationMs(String(item._id));
      changed = true;
    }

    const endsAtMs = new Date(item.urgencyEndsAt || "").getTime();
    if (!Number.isFinite(endsAtMs)) {
      item.urgencyEndsAt = buildUrgencyEndsAt(item.urgencyDurationMs);
      changed = true;
    }

    if (changed) {
      await item.save();
    }
  }
  return { items: items.map(mapItemToClient) };
}

async function addCartItem(userId, payload) {
  const productId = parseProductId(payload.productId ?? payload.id);
  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const color = String(payload.color || "");
  const size = String(payload.size || "");
  const storage = String(payload.storage || "");
  const model = String(payload.model || "");
  const incomingQty = Math.max(1, Number(payload.quantity) || 1);
  const variant = { color, size, storage, model };

  const existing = await CartItem.findOne({
    userId,
    productId,
    color,
    size,
    storage,
    model,
  });

  const hasVariantStock = hasVariantStockData(product);
  const variantAvailableQty = resolveVariantAvailability(product, variant);
  const nextRequestedQty = (existing?.quantity || 0) + incomingQty;

  if (variantAvailableQty != null && nextRequestedQty > variantAvailableQty) {
    throw new HttpError(
      409,
      `Mahsulot yetarli emas (so'ralgan ${nextRequestedQty}, qolgan ${variantAvailableQty})`,
      "INSUFFICIENT_STOCK",
    );
  }

  if (variantAvailableQty == null && hasVariantStock) {
    throw new HttpError(
      409,
      "Tanlangan variant hozircha mavjud emas",
      "INSUFFICIENT_STOCK",
    );
  }

  if (!hasVariantStock) {
    const availableQty = Math.max(0, Number(product?.quantity) || 0);
    if (nextRequestedQty > availableQty) {
      throw new HttpError(
        409,
        `Mahsulot yetarli emas (so'ralgan ${nextRequestedQty}, qolgan ${availableQty})`,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  if (existing) {
    existing.quantity = nextRequestedQty;
    if (payload.title !== undefined) existing.title = payload.title;
    if (payload.price !== undefined) existing.price = Number(payload.price) || 0;
    if (payload.originalPrice !== undefined) {
      existing.originalPrice = Number(payload.originalPrice) || 0;
    }
    if (payload.image) existing.image = payload.image;
    const nextCountries = Array.isArray(payload.countries)
      ? payload.countries
      : product.countries || [];
    if (nextCountries.length > 0) {
      existing.countries = nextCountries;
    }
    if (payload.weight !== undefined || product.weight !== undefined) {
      existing.weight = Number(payload.weight) || product.weight || 300;
    }
    if (!Number.isFinite(existing.urgencyStockLeft)) {
      existing.urgencyStockLeft = await pickDistinctUrgencyStock(userId, existing._id);
    }
    if (!Number.isFinite(existing.urgencyDurationMs)) {
      existing.urgencyDurationMs = buildUrgencyDurationMs(String(existing._id));
    }
    const endsAtMs = new Date(existing.urgencyEndsAt || "").getTime();
    if (!Number.isFinite(endsAtMs) || endsAtMs <= Date.now()) {
      existing.urgencyEndsAt = buildUrgencyEndsAt(existing.urgencyDurationMs);
    }
    existing.urgencyNextShowAt = buildNextShowAt();
    await existing.save();
    return getCartForUser(userId);
  }

  const doc = new CartItem({
    userId,
    productId,
    quantity: incomingQty,
    color,
    size,
    storage,
    model,
    title: payload.title ?? product.title ?? "Mahsulot",
    price: Number(payload.price) || 0,
    originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
    image: payload.image || "/img/no-image.png",
    countries: Array.isArray(payload.countries) ? payload.countries : product.countries || [],
    weight: Number(payload.weight) || product.weight || 300,
    urgencyStockLeft: await pickDistinctUrgencyStock(userId),
    urgencyNextShowAt: null,
    urgencyEndsAt: null,
    urgencyDurationMs: null,
  });
  doc.urgencyDurationMs = buildUrgencyDurationMs(String(doc._id));
  doc.urgencyEndsAt = buildUrgencyEndsAt(doc.urgencyDurationMs);
  doc.urgencyNextShowAt = buildNextShowAt();
  await doc.save();

  return getCartForUser(userId);
}

async function updateCartItemQuantity(userId, itemId, change) {
  const item = await CartItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }

  const delta = Number(change);
  if (!Number.isFinite(delta)) {
    throw new HttpError(400, "Miqdor noto'g'ri", "INVALID_QUANTITY");
  }

  const nextQty = (item.quantity || 1) + delta;
  if (nextQty <= 0) {
    await CartItem.deleteOne({ _id: item._id });
  } else {
    item.quantity = nextQty;
    await item.save();
  }

  return getCartForUser(userId);
}

async function removeCartItem(userId, itemId) {
  const result = await CartItem.deleteOne({ _id: itemId, userId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }
  return getCartForUser(userId);
}

async function clearCartForUser(userId) {
  await CartItem.deleteMany({ userId });
  return getCartForUser(userId);
}

async function checkoutCartForUser(userId, options = {}) {
  const items = await CartItem.find({ userId }).sort({ createdAt: -1 });
  if (items.length === 0) {
    return { items: [] };
  }

  const requestedByProductId = new Map();
  const variantRequestsByProductId = new Map();
  for (const item of items) {
    const productId = Number(item.productId);
    const orderedQty = Math.max(1, Number(item.quantity) || 1);
    const prev = requestedByProductId.get(productId) || 0;
    requestedByProductId.set(productId, prev + orderedQty);

    const variant = {
      color: String(item.color || ""),
      size: String(item.size || ""),
      storage: String(item.storage || ""),
      model: String(item.model || ""),
    };
    const variantKey = JSON.stringify(variant);
    let perProductMap = variantRequestsByProductId.get(productId);
    if (!perProductMap) {
      perProductMap = new Map();
      variantRequestsByProductId.set(productId, perProductMap);
    }
    const existingVariant = perProductMap.get(variantKey);
    if (existingVariant) {
      existingVariant.requestedQty += orderedQty;
    } else {
      perProductMap.set(variantKey, { variant, requestedQty: orderedQty });
    }
  }

  const productIds = [...requestedByProductId.keys()].filter(Number.isFinite);
  const products = await Product.find({ id: { $in: productIds } })
    .select("id title quantity colors colorStock sizeStock storage storageStock models modelStock categoryName sellerId");
  const productMap = new Map(products.map((product) => [Number(product.id), product]));

  const insufficient = [];
  const hasVariantStockByProductId = new Map();

  for (const [productId, perProductVariantMap] of variantRequestsByProductId.entries()) {
    const product = productMap.get(productId);
    if (!product) continue;
    const productTitle = getProductTitleText(product.title, productId);
    const hasVariantStock = hasVariantStockData(product);
    hasVariantStockByProductId.set(productId, hasVariantStock);

    // Variant tekshiruvini ketma-ket "simulyatsiya" qilamiz:
    // bir variant sarflangandan keyin keyingisiga qolgan stok hisoblanadi.
    const workingProduct = product.toObject ? product.toObject() : JSON.parse(JSON.stringify(product));

    for (const entry of perProductVariantMap.values()) {
      const available = resolveVariantAvailability(workingProduct, entry.variant);
      if (available == null) continue; // Faqat umumiy quantity bilan yuradigan product bo'lishi mumkin.
      if (available < entry.requestedQty) {
        insufficient.push({
          productId,
          title: productTitle,
          requestedQty: entry.requestedQty,
          availableQty: available,
          variant: entry.variant,
        });
        continue;
      }
      applyVariantDecrement(workingProduct, entry.variant, entry.requestedQty);
    }
  }

  for (const [productId, requestedQty] of requestedByProductId.entries()) {
    const product = productMap.get(productId);
    if (!product) {
      throw new HttpError(404, `Mahsulot topilmadi: ${productId}`, "PRODUCT_NOT_FOUND");
    }
    const hasVariantStock = hasVariantStockByProductId.get(productId) === true;
    if (hasVariantStock) continue;

    const availableQty = Math.max(0, Number(product.quantity) || 0);
    if (availableQty < requestedQty) {
      insufficient.push({
        productId,
        title: getProductTitleText(product.title, productId),
        requestedQty,
        availableQty,
      });
    }
  }

  if (insufficient.length > 0) {
    const first = insufficient[0];
    const variantHint = first?.variant
      ? ` [rang: ${first.variant.color || "-"}, size: ${first.variant.size || "-"}, storage: ${first.variant.storage || "-"}, model: ${first.variant.model || "-"}]`
      : "";
    throw new HttpError(
      409,
      `Mahsulot yetarli emas: ${first.title}${variantHint} (so'ralgan ${first.requestedQty}, qolgan ${first.availableQty})`,
      "INSUFFICIENT_STOCK",
      insufficient,
    );
  }

  const postOrderReview = buildPostOrderReviewPayload(items);

  const order = await recordCartPayment({
    userId,
    cartItems: items,
    productMap,
    paymentMethod: options.paymentMethod,
    deliveryAddress: options.deliveryAddress,
  });

  await markProductsAsSold({
    requestedByProductId,
    variantRequestsByProductId,
    productMap,
    hasVariantStockByProductId,
    applyVariantDecrement,
  });

  await CartItem.deleteMany({ userId });
  return {
    items: [],
    postOrderReview,
    paymentMethod: String(order?.paymentMethod || options.paymentMethod || ""),
  };
}

async function dismissCartUrgency(userId, itemId) {
  const item = await CartItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }
  const current = Number(item.urgencyStockLeft);
  if (Number.isFinite(current)) {
    item.urgencyStockLeft = Math.max(1, current - 1);
  } else {
    item.urgencyStockLeft = 1;
  }
  if (!Number.isFinite(item.urgencyDurationMs)) {
    item.urgencyDurationMs = buildUrgencyDurationMs(String(item._id));
  }
  const endsAtMs = new Date(item.urgencyEndsAt || "").getTime();
  if (!Number.isFinite(endsAtMs) || endsAtMs <= Date.now()) {
    item.urgencyEndsAt = buildUrgencyEndsAt(item.urgencyDurationMs);
  }
  item.urgencyNextShowAt = buildNextShowAt();
  await item.save();
  return getCartForUser(userId);
}

module.exports = {
  getCartForUser,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartForUser,
  checkoutCartForUser,
  dismissCartUrgency,
};
