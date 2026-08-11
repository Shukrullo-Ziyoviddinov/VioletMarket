const { Product } = require("../models");
const { SellerAccount } = require("../models/sellerAccount");
const { MasterCategory } = require("../models/masterCategory");
const { ShippingCountry } = require("../models/shippingCountry");
const { BrandCountryFilterValue } = require("../models/brandCountryFilterValue");
const {
  listProductTypes,
  normalizeProductTypeValue,
  resolveProductTypeCode,
} = require("./adminProductTypeService");
const { resolvePublicAssetUrl } = require("../utils/resolvePublicAssetUrl");
const { computeEffectiveQuantity } = require("./productService");
const { HttpError } = require("../utils/httpError");
const { isProductActiveOnClient } = require("../utils/productClientVisibility");
const { normalizeSellerAccountStatus, isSellerAccountPaused } = require("../utils/sellerAccountStatus");

const SUPER_NARX_ICON = "<i class='bx bxs-hot'></i>";
const SUPER_NARX_COLOR = "#13BE4C";
const ORIGINAL_ICON = "&#10004;";
const ORIGINAL_COLOR = "#f30cfb";
const CHEGIRMA_ICON = '<span class="animated-hourglass"></span>';
const CHEGIRMA_COLOR = "#ff3333";

const COUNTRY_CODE_ALIASES = {
  xitoy: "china",
  kitay: "china",
  aqsh: "usa",
  us: "usa",
  koreya: "korea",
};

const COUNTRY_FILTER_LEGACY_ALIASES = {
  usa: "usa",
  us: "usa",
  aqsh: "usa",
  china: "xitoy",
  kitay: "xitoy",
  xitoy: "xitoy",
  turkiya: "turkiya",
  turkey: "turkiya",
  korea: "koreya",
  koreya: "koreya",
  uzbekistan: "uzb",
  uzbekiston: "uzb",
  "o'zbekiston": "uzb",
  uzb: "uzb",
  yevropa: "yevropa",
  europe: "yevropa",
};

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
    status: normalizeSellerAccountStatus(seller.status),
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
    clientActive: isProductActiveOnClient(product),
    pausedBySeller: Boolean(product.pausedBySeller),
    approvalStatus: product.approvalStatus || null,
    cargoExpressPolicy: product.cargoExpressPolicy ?? null,
  };
}

async function buildSellerMap() {
  const sellers = await SellerAccount.find()
    .select({ id: 1, name: 1, logo: 1, status: 1 })
    .lean();

  return new Map(sellers.map((seller) => [seller.id, seller]));
}

async function assertSellerAllowsProductClientActiveToggle(sellerIdRaw) {
  const sellerId = String(sellerIdRaw || "").trim();
  if (!sellerId) return;

  const seller = await SellerAccount.findOne({ id: sellerId })
    .select({ id: 1, status: 1 })
    .lean();

  if (!seller) return;

  if (isSellerAccountPaused(seller.status)) {
    throw new HttpError(
      403,
      "Sotuvchi vaqtincha to'xtatilgan. Mahsulotni alohida faollashtirib yoki to'xtatib bo'lmaydi",
      "SELLER_PAUSED_PRODUCT_TOGGLE_BLOCKED",
    );
  }
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
        clientActive: 1,
        pausedBySeller: 1,
        approvalStatus: 1,
        cargoExpressPolicy: 1,
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
    category: String(product.category || "").trim(),
    masterCategoryId: Number.isFinite(Number(product.masterCategoryId))
      ? Number(product.masterCategoryId)
      : null,
    title: product.title || { uz: "", ru: "" },
    price: product.price || "",
    originalPrice: product.originalPrice || "",
    discount: product.discount || null,
    video: product.video || "",
    labels: Array.isArray(product.labels) ? product.labels : [],
    relatedGroups: Array.isArray(product.relatedGroups) ? product.relatedGroups : [],
    countries: Array.isArray(product.countries) ? product.countries : [],
    countriesCategories: String(product.countriesCategories || "").trim(),
    brandCategories: String(product.brandCategories || "").trim(),
    productCountry: String(product.productCountry || "").trim(),
    productType: String(product.productType || "").trim(),
  };
}

function normalizeCountryToken(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  return COUNTRY_CODE_ALIASES[key] || key;
}

async function listActiveShippingCountries() {
  const rows = await ShippingCountry.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, id: 1 })
    .lean();
  return rows;
}

function resolveCountryCodes(rawCountries, shippingRows) {
  const rows = Array.isArray(shippingRows) ? shippingRows : [];
  const list = Array.isArray(rawCountries) ? rawCountries : rawCountries ? [rawCountries] : [];
  const codes = new Set();

  for (const item of list) {
    const token = normalizeCountryToken(item);
    if (!token) continue;

    const byCode = rows.find((row) => normalizeCountryToken(row.code) === token);
    if (byCode) {
      codes.add(String(byCode.code));
      continue;
    }

    const rawText = String(item || "").trim();
    const byName = rows.find(
      (row) =>
        String(row?.name?.uz || "").trim() === rawText ||
        String(row?.name?.ru || "").trim() === rawText ||
        normalizeCountryToken(row?.name?.uz) === token,
    );
    if (byName) {
      codes.add(String(byName.code));
    }
  }

  return [...codes];
}

async function normalizeProductCountries(body) {
  const shippingRows = await listActiveShippingCountries();
  const requested = Array.isArray(body?.countryCodes) ? body.countryCodes : [];
  const unique = [...new Set(requested.map((code) => normalizeCountryToken(code)).filter(Boolean))];

  if (unique.length === 0) {
    throw new HttpError(400, "Kamida bitta mahsulot hududi tanlanishi shart", "VALIDATION_ERROR");
  }

  for (const code of unique) {
    const row = shippingRows.find((item) => String(item.code) === code);
    if (!row) {
      throw new HttpError(400, `Mahsulot hududi topilmadi: ${code}`, "VALIDATION_ERROR");
    }
  }

  return unique;
}

function normalizeFilterToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function listBrandCountryFilterValues() {
  return BrandCountryFilterValue.find().sort({ type: 1, id: 1 }).lean();
}

function normalizeCountryFilterToken(value) {
  const token = normalizeFilterToken(value);
  if (!token) return "";
  return COUNTRY_FILTER_LEGACY_ALIASES[token] || token;
}

function resolveProductFilterValue(rawValue, rows, type) {
  let token = normalizeFilterToken(rawValue);
  if (!token) return "";

  if (type === "country") {
    token = normalizeCountryFilterToken(rawValue);
  }

  const list = (Array.isArray(rows) ? rows : []).filter((item) => String(item?.type) === type);
  const row = list.find((item) => normalizeFilterToken(item?.filterValue) === token);
  return row ? String(row.filterValue).trim() : String(rawValue || "").trim();
}

async function normalizeCountryFilterField(rawValue) {
  const raw = String(rawValue ?? "").trim();
  if (!raw) {
    return "";
  }

  const rows = await listBrandCountryFilterValues();
  const token = normalizeCountryFilterToken(raw);
  const row = rows.find(
    (item) => item.type === "country" && normalizeFilterToken(item?.filterValue) === token,
  );
  if (!row) {
    throw new HttpError(400, "Country filter topilmadi", "VALIDATION_ERROR");
  }

  return String(row.filterValue).trim();
}

async function normalizeBrandCategories(body) {
  const raw = String(body?.brandCategories ?? "").trim();
  if (!raw) {
    return "";
  }

  const rows = await listBrandCountryFilterValues();
  const token = normalizeFilterToken(raw);
  const row = rows.find(
    (item) => item.type === "brand" && normalizeFilterToken(item?.filterValue) === token,
  );
  if (!row) {
    throw new HttpError(400, "BrandCategories filter topilmadi", "VALIDATION_ERROR");
  }

  return String(row.filterValue).trim();
}

async function resolveMasterCategoryId(product) {
  const directId = Number(product?.masterCategoryId);
  if (Number.isFinite(directId) && directId > 0) {
    return directId;
  }

  const categoryText = String(product?.category || "").trim();
  if (!categoryText) return null;

  const row = await MasterCategory.findOne({
    $or: [{ "name.uz": categoryText }, { "name.ru": categoryText }],
  }).lean();

  return row?.id ?? null;
}

async function enrichProductForEdit(product) {
  const mapped = mapProductForEdit(product);
  const [shippingRows, filterRows] = await Promise.all([
    listActiveShippingCountries(),
    listBrandCountryFilterValues(),
  ]);
  mapped.masterCategoryId = await resolveMasterCategoryId(product);
  mapped.countryCodes = resolveCountryCodes(mapped.countries, shippingRows);
  mapped.countriesCategories = resolveProductFilterValue(
    mapped.countriesCategories,
    filterRows,
    "country",
  );
  mapped.productCountry = resolveProductFilterValue(mapped.productCountry, filterRows, "country");
  const syncedCountryFilter = mapped.productCountry || mapped.countriesCategories;
  mapped.productCountry = syncedCountryFilter;
  mapped.countriesCategories = syncedCountryFilter;
  mapped.brandCategories = resolveProductFilterValue(mapped.brandCategories, filterRows, "brand");
  const productTypeRows = await listProductTypes({ activeOnly: false });
  mapped.productType = resolveProductTypeCode(mapped.productType, productTypeRows);
  return mapped;
}

async function resolveProductCategory(body) {
  const masterCategoryId = Number(body?.masterCategoryId);
  if (Number.isFinite(masterCategoryId) && masterCategoryId > 0) {
    const row = await MasterCategory.findOne({ id: Math.floor(masterCategoryId) }).lean();
    if (!row) {
      throw new HttpError(400, "Master category noto'g'ri", "VALIDATION_ERROR");
    }
    return {
      category: String(row?.name?.uz || "").trim(),
      masterCategoryId: Number(row.id),
    };
  }

  const categoryText = String(body?.category || "").trim();
  if (categoryText) {
    const row = await MasterCategory.findOne({
      $or: [{ "name.uz": categoryText }, { "name.ru": categoryText }],
    }).lean();
    if (!row) {
      throw new HttpError(400, `Master category topilmadi: ${categoryText}`, "VALIDATION_ERROR");
    }
    return {
      category: String(row?.name?.uz || "").trim(),
      masterCategoryId: Number(row.id),
    };
  }

  throw new HttpError(400, "Category tanlanishi shart", "VALIDATION_ERROR");
}

async function getProductForEdit(productIdRaw) {
  const productId = parseProductId(productIdRaw);
  const product = await findNewestProductDoc(productId);
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }
  return enrichProductForEdit(product);
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

async function normalizeUpdatePayload(body, currentProductId) {
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
  const categoryFields = await resolveProductCategory(body);
  const countries = await normalizeProductCountries(body);
  const countryFilterValue = await normalizeCountryFilterField(
    String(body?.productCountry ?? "").trim() || String(body?.countriesCategories ?? "").trim(),
  );
  const brandCategories = await normalizeBrandCategories(body);
  const productType = await normalizeProductTypeValue(body?.productType);

  return {
    title,
    price,
    originalPrice,
    discount,
    video,
    labels,
    relatedGroups,
    category: categoryFields.category,
    masterCategoryId: categoryFields.masterCategoryId,
    countries,
    countriesCategories: countryFilterValue,
    productCountry: countryFilterValue,
    brandCategories,
    productType,
  };
}

async function updateProductForAdmin(productIdRaw, body) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const payload = await normalizeUpdatePayload(body, productId);
  const sellerId = String(existing.sellerId || "").trim();
  const relatedIds = payload.relatedGroups.flatMap((group) => group.productIds || []);
  await assertRelatedProductIdsForSeller(relatedIds, sellerId, productId);

  await Product.updateOne({ _id: existing._id }, { $set: payload });
  const updated = await findNewestProductDoc(productId);
  return enrichProductForEdit(updated);
}

async function deleteProductForAdmin(productIdRaw) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  await Product.deleteMany({ id: productId });
  return { id: productId };
}

async function setProductClientActive(productIdRaw, clientActiveRaw) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  await assertSellerAllowsProductClientActiveToggle(existing.sellerId);

  const clientActive = clientActiveRaw !== false;
  await Product.updateMany(
    { id: productId },
    {
      $set: {
        clientActive,
        pausedBySeller: false,
      },
    },
  );

  return {
    id: productId,
    clientActive,
    pausedBySeller: false,
  };
}

module.exports = {
  listProductsForAdmin,
  getProductStats,
  getProductForEdit,
  listProductPickerOptions,
  updateProductForAdmin,
  deleteProductForAdmin,
  setProductClientActive,
};
