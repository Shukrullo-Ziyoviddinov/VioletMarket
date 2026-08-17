const { CartItem } = require("../../models/cart");
const { Product } = require("../../models/product");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const {
  reserveOnCheckout,
} = require("../../inventory");
const {
  buildPostOrderReviewPayload,
  recordCartPayment,
} = require("../../productManagement");
const {
  applyVariantDecrement,
  hasVariantStockData,
  resolveVariantAvailability,
} = require("../../productManagement/variantStockAdjust");
const {
  requireDeliveryRegionAddress,
} = require("../../utils/normalizeDeliveryAddress");
const { isProductActiveOnClient } = require("../../utils/productClientVisibility");
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

async function findNewestProductById(productId) {
  const rows = await Product.find({ id: productId }).sort({ _id: -1 }).limit(1).lean();
  return rows[0] || null;
}

function keepNewestProductsById(products) {
  const map = new Map();
  for (const product of Array.isArray(products) ? products : []) {
    const id = Number(product?.id);
    if (!Number.isFinite(id) || map.has(id)) continue;
    map.set(id, product);
  }
  return map;
}

async function assertProductPurchasable(productId) {
  const product = await findNewestProductById(productId);
  if (!product || !isProductActiveOnClient(product)) {
    throw new HttpError(
      409,
      "Mahsulot hozircha sotuvda emas",
      "PRODUCT_NOT_AVAILABLE",
    );
  }
  return product;
}

function getProductTitleText(title, fallback) {
  if (typeof title === "string" && title.trim()) return title;
  if (title && typeof title === "object") {
    if (typeof title.uz === "string" && title.uz.trim()) return title.uz;
    if (typeof title.ru === "string" && title.ru.trim()) return title.ru;
  }
  return String(fallback || "Mahsulot");
}

function resolveCargoExpressPolicy(product, payload) {
  const raw = product?.cargoExpressPolicy ?? payload?.cargoExpressPolicy ?? null;
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (value === "standard_only" || value === "unrestricted") return value;
  return null;
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
    cargoExpressPolicy: row.cargoExpressPolicy ?? null,
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
  const product = await findNewestProductById(productId);
  if (!product || !isProductActiveOnClient(product)) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const color = String(payload.color || "").trim();
  const size = String(payload.size || "").trim();
  const storage = String(payload.storage || "").trim();
  const model = String(payload.model || "").trim();
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
    existing.cargoExpressPolicy = resolveCargoExpressPolicy(product, payload);
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
    cargoExpressPolicy: resolveCargoExpressPolicy(product, payload),
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

  // Oshirish — faqat live mahsulot; kamaytirish/o'chirish ochiq
  if (delta > 0) {
    await assertProductPurchasable(item.productId);
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

async function saveDeliveryAddressForUser(userId, rawAddress) {
  const normalized = requireDeliveryRegionAddress(
    rawAddress,
    "Manzil bo‘sh yoki viloyati aniqlanmadi",
  );

  const extra =
    rawAddress && typeof rawAddress === "object" && !Array.isArray(rawAddress)
      ? rawAddress
      : {};

  const payload = {
    ...normalized,
    placeType: String(extra.placeType || normalized.placeType || "").trim(),
    entrance: String(extra.entrance || normalized.entrance || "").trim(),
    floor: String(extra.floor || normalized.floor || "").trim(),
    domofon: String(extra.domofon || normalized.domofon || "").trim(),
    courierNote: String(extra.courierNote || normalized.courierNote || "").trim(),
    formatted: String(extra.formatted || normalized.addressLine || "").trim(),
  };

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { savedDeliveryAddress: payload } },
    { new: true },
  );
  if (!user) {
    throw new HttpError(404, "Foydalanuvchi topilmadi", "USER_NOT_FOUND");
  }

  return {
    deliveryAddress: user.savedDeliveryAddress || payload,
  };
}

async function resolveCheckoutDeliveryAddress(userId, rawAddress) {
  const tryNormalize = (raw) => {
    if (!raw) return null;
    try {
      return requireDeliveryRegionAddress(raw);
    } catch (error) {
      if (
        error?.code === "DELIVERY_ADDRESS_REQUIRED" ||
        error?.code === "DELIVERY_REGION_UNRESOLVED"
      ) {
        return null;
      }
      throw error;
    }
  };

  const fromBody = tryNormalize(rawAddress);
  if (fromBody) return fromBody;

  const user = await User.findById(userId).select("savedDeliveryAddress").lean();
  return tryNormalize(user?.savedDeliveryAddress);
}

async function checkoutCartForUser(userId, options = {}) {
  const items = await CartItem.find({ userId }).sort({ createdAt: -1 });
  if (items.length === 0) {
    return { items: [] };
  }

  const deliveryAddress = await resolveCheckoutDeliveryAddress(
    userId,
    options.deliveryAddress,
  );

  if (!deliveryAddress) {
    throw new HttpError(
      400,
      "Yetkazib berish manzili yuborilmadi. Checkout’da manzilni qayta saqlang, keyin to‘lov qiling.",
      "DELIVERY_ADDRESS_REQUIRED",
    );
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
    .select(
      "id title quantity colors colorStock sizeStock storage storageStock models modelStock categoryName sellerId clientActive approvalStatus cargoExpressPolicy countries",
    )
    .sort({ _id: -1 });
  const productMap = keepNewestProductsById(products);

  const unavailable = [];
  for (const productId of productIds) {
    const product = productMap.get(productId);
    const plain = product?.toObject ? product.toObject() : product;
    if (!plain || !isProductActiveOnClient(plain)) {
      unavailable.push({
        productId,
        title: getProductTitleText(plain?.title, productId),
      });
    }
  }

  if (unavailable.length > 0) {
    const first = unavailable[0];
    throw new HttpError(
      409,
      `Mahsulot hozircha sotuvda emas: ${first.title}`,
      "PRODUCT_NOT_AVAILABLE",
      unavailable,
    );
  }

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

  const postOrderReview = {
    ...buildPostOrderReviewPayload(items),
    shouldShowReview: false,
  };

  const order = await recordCartPayment({
    userId,
    cartItems: items,
    productMap,
    paymentMethod: options.paymentMethod,
    deliveryAddress,
    selectedCargoOptions: options.selectedCargoOptions,
  });

  if (deliveryAddress) {
    await User.findByIdAndUpdate(userId, {
      $set: { savedDeliveryAddress: deliveryAddress },
    }).catch(() => null);
  }

  await reserveOnCheckout({
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
    deliveryAddress: order?.deliveryAddress || null,
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
  saveDeliveryAddressForUser,
  dismissCartUrgency,
};
