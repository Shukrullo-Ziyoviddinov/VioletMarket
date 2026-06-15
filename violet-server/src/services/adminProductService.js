const { Product } = require("../models");
const { SellerAccount } = require("../models/sellerAccount");
const { resolvePublicAssetUrl } = require("../utils/resolvePublicAssetUrl");
const { computeEffectiveQuantity } = require("./productService");
const { HttpError } = require("../utils/httpError");

const SUPER_NARX_ICON = "<i class='bx bxs-hot'></i>";
const SUPER_NARX_COLOR = "#13BE4C";
const ORIGINAL_ICON = "&#10004;";
const ORIGINAL_COLOR = "#f30cfb";
const CHEGIRMA_ICON = '<span class="animated-hourglass"></span>';
const CHEGIRMA_COLOR = "#ff3333";

function keepNewestProductPerId(products) {
  const seen = new Set();
  const unique = [];

  for (const product of Array.isArray(products) ? products : []) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function getTodayRange(referenceDate = new Date()) {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function countAddedToday(products) {
  const { start, end } = getTodayRange();

  return products.filter((product) => {
    const createdAt = product._id?.getTimestamp?.();
    if (!createdAt) return false;
    return createdAt >= start && createdAt < end;
  }).length;
}

function mapSellerForAdmin(seller) {
  if (!seller) return null;

  const logo = seller.logo || "";

  return {
    id: seller.id,
    name: seller.name,
    logo,
    logoUrl: resolvePublicAssetUrl(logo),
  };
}

function mapProductCard(product, sellerMap) {
  const firstColor = Array.isArray(product.colors) ? product.colors[0] : null;
  const sellerId = String(product.sellerId || "").trim();
  const image = product.image || product.mainImage || firstColor?.mainImage || "";

  return {
    id: product.id,
    title: product.title,
    price: firstColor?.price || product.price || "",
    originalPrice: firstColor?.originalPrice || product.originalPrice || "",
    image,
    imageUrl: resolvePublicAssetUrl(image),
    effectiveQuantity: computeEffectiveQuantity(product),
    sellerId: sellerId || null,
    seller: sellerId ? mapSellerForAdmin(sellerMap.get(sellerId)) : null,
  };
}

async function buildSellerMap() {
  const sellers = await SellerAccount.find()
    .select({ id: 1, name: 1, logo: 1 })
    .lean();

  return new Map(sellers.map((seller) => [seller.id, seller]));
}

async function listProductsForAdmin() {
  const [rows, sellerMap] = await Promise.all([
    Product.find()
      .select({
        id: 1,
        title: 1,
        price: 1,
        originalPrice: 1,
        image: 1,
        mainImage: 1,
        colors: 1,
        sellerId: 1,
        quantity: 1,
        models: 1,
        storage: 1,
        modelStock: 1,
        storageStock: 1,
        sizeStock: 1,
        colorStock: 1,
      })
      .sort({ _id: -1 })
      .lean(),
    buildSellerMap(),
  ]);

  return keepNewestProductPerId(rows).map((product) => mapProductCard(product, sellerMap));
}

async function getProductStats() {
  const rows = await Product.find().select({ id: 1, _id: 1 }).sort({ _id: -1 }).lean();
  const unique = keepNewestProductPerId(rows);

  return {
    total: unique.length,
    addedToday: countAddedToday(unique),
  };
}

function normalizeI18nPair(raw, fieldName) {
  const uz = String(raw?.uz ?? "").trim();
  const ru = String(raw?.ru ?? "").trim();
  if (!uz || !ru) {
    throw new HttpError(400, `${fieldName} (UZ/RU) to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeOptionalI18nPair(raw) {
  const uz = String(raw?.uz ?? "").trim();
  const ru = String(raw?.ru ?? "").trim();
  if (!uz && !ru) return null;
  if (!uz || !ru) {
    throw new HttpError(400, "Ikkala til (UZ/RU) ham to'ldirilishi kerak", "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

async function findNewestProductDoc(productId) {
  const rows = await Product.find({ id: productId }).sort({ _id: -1 }).limit(1).lean();
  return rows[0] || null;
}

function mapProductForEdit(product) {
  if (!product) return null;

  const sellerId = String(product.sellerId || "").trim();

  return {
    id: product.id,
    sellerId: sellerId || null,
    title: product.title || { uz: "", ru: "" },
    price: product.price || "",
    originalPrice: product.originalPrice || "",
    discount: product.discount || null,
    video: product.video || "",
    labels: Array.isArray(product.labels) ? product.labels : [],
    relatedGroups: Array.isArray(product.relatedGroups) ? product.relatedGroups : [],
  };
}

async function getProductForEdit(productIdRaw) {
  const productId = parseProductId(productIdRaw);
  const product = await findNewestProductDoc(productId);
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }
  return mapProductForEdit(product);
}

async function listProductPickerOptions(forProductIdRaw) {
  if (forProductIdRaw == null || forProductIdRaw === "") {
    return [];
  }

  const forProductId = parseProductId(forProductIdRaw);
  const sourceProduct = await findNewestProductDoc(forProductId);
  if (!sourceProduct) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const sellerId = String(sourceProduct.sellerId || "").trim();
  if (!sellerId) {
    return [];
  }

  const rows = await Product.find({ sellerId })
    .select({ id: 1, title: 1, sellerId: 1 })
    .sort({ _id: -1 })
    .lean();

  return keepNewestProductPerId(rows)
    .filter((product) => Number(product.id) !== forProductId)
    .map((product) => ({
      id: product.id,
      title: product.title || { uz: "", ru: "" },
      sellerId: product.sellerId,
    }));
}

async function assertRelatedProductIdsForSeller(productIds, sellerId, currentProductId) {
  const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map(Number))]
    .filter((id) => Number.isFinite(id) && id !== currentProductId);

  if (ids.length === 0) return;

  if (!sellerId) {
    throw new HttpError(
      400,
      "Sotuvchi biriktirilmagan mahsulotga related mahsulot qo'shib bo'lmaydi",
      "VALIDATION_ERROR",
    );
  }

  const rows = await Product.find({ id: { $in: ids } })
    .select({ id: 1, sellerId: 1 })
    .sort({ _id: -1 })
    .lean();

  const newestById = new Map();
  for (const row of rows) {
    const key = String(row.id);
    if (!newestById.has(key)) newestById.set(key, row);
  }

  for (const id of ids) {
    const row = newestById.get(String(id));
    if (!row) {
      throw new HttpError(400, `Related mahsulot topilmadi: ${id}`, "VALIDATION_ERROR");
    }
    if (String(row.sellerId || "").trim() !== sellerId) {
      throw new HttpError(
        400,
        `Mahsulot #${id} shu sotuvchiga tegishli emas`,
        "VALIDATION_ERROR",
      );
    }
  }
}

function normalizeLabelDraft(raw) {
  const labels = [];
  const types = Array.isArray(raw?.types) ? raw.types : [];

  if (types.includes("chegirma")) {
    const percent = String(raw?.chegirmaPercent ?? "").trim().replace(/%/g, "");
    if (!percent) {
      throw new HttpError(400, "Chegirma foizi kiritilishi shart", "VALIDATION_ERROR");
    }
    labels.push({
      text: {
        uz: `Chegirma ${percent}%`,
        ru: `Скидка ${percent}%`,
      },
      icon: CHEGIRMA_ICON,
      color: CHEGIRMA_COLOR,
    });
  }

  if (types.includes("original")) {
    labels.push({
      text: { uz: "Original", ru: "Оригинал" },
      icon: ORIGINAL_ICON,
      color: ORIGINAL_COLOR,
    });
  }

  if (types.includes("superNarx")) {
    labels.push({
      text: { uz: "Super narx", ru: "Супер цена" },
      icon: SUPER_NARX_ICON,
      color: SUPER_NARX_COLOR,
    });
  }

  return labels;
}

function normalizeRelatedGroups(raw, currentProductId) {
  const groups = (Array.isArray(raw) ? raw : []).filter((group) => {
    const titleUz = String(group?.title?.uz ?? "").trim();
    const titleRu = String(group?.title?.ru ?? "").trim();
    const productIds = Array.isArray(group?.productIds) ? group.productIds : [];
    return titleUz || titleRu || productIds.length > 0;
  });

  const normalized = groups.map((group, index) => {
    const title = normalizeI18nPair(group?.title, `Turkum #${index + 1} sarlavhasi`);
    const productIds = (Array.isArray(group?.productIds) ? group.productIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id !== currentProductId);

    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length > 3) {
      throw new HttpError(
        400,
        `Turkum #${index + 1} uchun maksimal 3 ta mahsulot tanlash mumkin`,
        "VALIDATION_ERROR",
      );
    }

    return {
      title,
      productIds: uniqueIds,
    };
  });

  return normalized;
}

function normalizeUpdatePayload(body, currentProductId) {
  const title = normalizeI18nPair(body?.title, "Sarlavha");
  const price = String(body?.price ?? "").trim();
  if (!price) {
    throw new HttpError(400, "Narx to'ldirilishi shart", "VALIDATION_ERROR");
  }

  const originalPrice = String(body?.originalPrice ?? "").trim();
  const discount = normalizeOptionalI18nPair(body?.discount);
  const video = String(body?.video ?? "").trim();
  const labels = normalizeLabelDraft(body?.labels);
  const relatedGroups = normalizeRelatedGroups(body?.relatedGroups, currentProductId);

  return {
    title,
    price,
    originalPrice,
    discount,
    video,
    labels,
    relatedGroups,
  };
}

async function updateProductForAdmin(productIdRaw, body) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const payload = normalizeUpdatePayload(body, productId);
  const sellerId = String(existing.sellerId || "").trim();
  const relatedIds = payload.relatedGroups.flatMap((group) => group.productIds || []);
  await assertRelatedProductIdsForSeller(relatedIds, sellerId, productId);

  await Product.updateOne({ _id: existing._id }, { $set: payload });
  const updated = await findNewestProductDoc(productId);
  return mapProductForEdit(updated);
}

module.exports = {
  listProductsForAdmin,
  getProductStats,
  getProductForEdit,
  listProductPickerOptions,
  updateProductForAdmin,
};
