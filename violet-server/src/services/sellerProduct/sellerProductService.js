const { Product } = require("../../models/product");
const { SellerAccount } = require("../../models/sellerAccount");
const { MasterCategory } = require("../../models/masterCategory");
const { ShippingCountry } = require("../../models/shippingCountry");
const { BrandCountryFilterValue } = require("../../models/brandCountryFilterValue");
const { createProduct } = require("../productService");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { hasVariantStockData } = require("../../utils/productStockRules");
const { isSellerAccountPaused } = require("../../utils/sellerAccountStatus");
const {
  FLASH_SECTION_CATEGORY_NAMES,
} = require("../adminFlashCategory/adminFlashCategoryConstants");
const {
  listProductTypes,
  normalizeProductTypeValue,
} = require("../adminProductTypeService");
const { resolveSellerPipelineMode } = require("../../productManagement/seller/sellerPipelineMode");
const {
  buildCreateApprovalFields,
  normalizeApprovalStatus,
  PRODUCT_APPROVAL_STATUS,
} = require("../../utils/productApproval");
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

function normalizeI18nPair(raw, fieldName, { required = true, fallback = null } = {}) {
  const uz = String(raw?.uz ?? "").trim();
  const ru = String(raw?.ru ?? "").trim();
  if (!uz && !ru) {
    if (!required && fallback) {
      return {
        uz: String(fallback?.uz ?? "").trim(),
        ru: String(fallback?.ru ?? "").trim(),
      };
    }
    if (!required) return { uz: "", ru: "" };
    throw new HttpError(400, `${fieldName} (UZ/RU) to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  if (!uz || !ru) {
    if (!required && fallback) {
      return {
        uz: uz || String(fallback?.uz ?? "").trim(),
        ru: ru || String(fallback?.ru ?? "").trim(),
      };
    }
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

function normalizeCountryToken(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  return COUNTRY_CODE_ALIASES[key] || key;
}

function normalizeFilterToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeCountryFilterToken(value) {
  const token = normalizeFilterToken(value);
  if (!token) return "";
  return COUNTRY_FILTER_LEGACY_ALIASES[token] || token;
}

async function listActiveShippingCountries() {
  return ShippingCountry.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, id: 1 })
    .lean();
}

async function listBrandCountryFilterValues() {
  return BrandCountryFilterValue.find().sort({ type: 1, id: 1 }).lean();
}

function resolveProductFilterValue(rawValue, rows, type) {
  let token = normalizeFilterToken(rawValue);
  if (!token) return "";

  const list = Array.isArray(rows) ? rows : [];
  const exact = list.find(
    (row) => row.type === type && normalizeFilterToken(row.filterValue) === token,
  );
  if (exact) return String(exact.filterValue || "").trim();

  const alias = type === "country" ? normalizeCountryFilterToken(token) : token;
  const byAlias = list.find(
    (row) => row.type === type && normalizeFilterToken(row.filterValue) === alias,
  );
  return byAlias ? String(byAlias.filterValue || "").trim() : String(rawValue || "").trim();
}

async function resolveProductCategory(body, { required = true, existing = null } = {}) {
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

  if (existing) {
    const existingCategory = String(existing.category || "").trim();
    const existingMasterId = Number(existing.masterCategoryId);
    if (existingCategory || (Number.isFinite(existingMasterId) && existingMasterId > 0)) {
      return {
        category: existingCategory,
        masterCategoryId: Number.isFinite(existingMasterId) && existingMasterId > 0
          ? existingMasterId
          : undefined,
      };
    }
  }

  if (!required) {
    return { category: "", masterCategoryId: undefined };
  }

  throw new HttpError(400, "Category tanlanishi shart", "VALIDATION_ERROR");
}

async function normalizeProductCountries(body, { required = true, existing = null } = {}) {
  const shippingRows = await listActiveShippingCountries();
  const requested = Array.isArray(body?.countryCodes) ? body.countryCodes : [];
  const unique = [...new Set(requested.map((code) => normalizeCountryToken(code)).filter(Boolean))];

  if (unique.length === 0) {
    const existingCountries = Array.isArray(existing?.countries)
      ? existing.countries.map((code) => normalizeCountryToken(code)).filter(Boolean)
      : [];
    if (existingCountries.length > 0) {
      return [...new Set(existingCountries)];
    }
    if (!required) return [];
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

async function normalizeCountryFilterField(rawValue) {
  const rows = await listBrandCountryFilterValues();
  return resolveProductFilterValue(rawValue, rows, "country");
}

async function normalizeBrandCategories(body) {
  const rows = await listBrandCountryFilterValues();
  return resolveProductFilterValue(body?.brandCategories, rows, "brand");
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

  return groups.map((group, index) => {
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
}

function normalizeStringArray(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function normalizeOptionalObject(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw;
}

function normalizeWeight(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new HttpError(400, "Og'irlik noto'g'ri", "VALIDATION_ERROR");
  }
  return Math.floor(num);
}

function normalizeCategoryName(raw, { required = true } = {}) {
  const categoryName = String(raw || "").trim();
  if (!categoryName) {
    if (!required) return "";
    throw new HttpError(400, "Bo'lim (categoryName) tanlanishi shart", "VALIDATION_ERROR");
  }
  if (!FLASH_SECTION_CATEGORY_NAMES.includes(categoryName)) {
    throw new HttpError(400, "Bo'lim noto'g'ri", "VALIDATION_ERROR");
  }
  return categoryName;
}

async function assertSellerCanManageProducts(sellerShopId) {
  const sellerId = String(sellerShopId || "").trim();
  if (!sellerId) {
    throw new HttpError(401, "Sotuvchi autentifikatsiyasi talab qilinadi", "UNAUTHORIZED");
  }

  const seller = await SellerAccount.findOne({ id: sellerId })
    .select({ id: 1, status: 1, sellerCountry: 1 })
    .lean();
  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  if (isSellerAccountPaused(seller.status)) {
    throw new HttpError(
      403,
      "Sotuvchi vaqtincha to'xtatilgan. Mahsulot qo'shib yoki tahrirlab bo'lmaydi",
      "SELLER_PAUSED",
    );
  }

  return seller;
}

async function assertSellerOwnsProduct(sellerShopId, productId) {
  const product = await findNewestProductDoc(productId);
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const sellerId = String(sellerShopId || "").trim();
  if (String(product.sellerId || "").trim() !== sellerId) {
    throw new HttpError(403, "Bu mahsulot sizga tegishli emas", "FORBIDDEN");
  }

  return product;
}

async function assertRelatedProductIdsForSeller(productIds, sellerId, currentProductId) {
  const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map(Number))]
    .filter((id) => Number.isFinite(id) && id !== currentProductId);

  if (ids.length === 0) return;

  const rows = await Product.find({ id: { $in: ids } })
    .select({ id: 1, sellerId: 1, approvalStatus: 1 })
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
      throw new HttpError(400, `Mahsulot #${id} shu sotuvchiga tegishli emas`, "VALIDATION_ERROR");
    }
    if (normalizeApprovalStatus(row.approvalStatus) === PRODUCT_APPROVAL_STATUS.PENDING) {
      throw new HttpError(
        400,
        `Mahsulot #${id} hali tasdiqlanmagan — related qilib bo'lmaydi`,
        "VALIDATION_ERROR",
      );
    }
  }
}

async function normalizeSellerProductPayload(body, { sellerShopId, productId = null, existing = null } = {}) {
  const isEdit = Boolean(existing);
  const required = !isEdit;

  const categoryNameRaw =
    String(body?.categoryName || "").trim() ||
    (isEdit ? String(existing?.categoryName || "").trim() : "");
  const categoryName = normalizeCategoryName(categoryNameRaw, { required });

  const title = normalizeI18nPair(body?.title, "Sarlavha", {
    required,
    fallback: isEdit ? existing?.title : null,
  });

  let price = String(body?.price ?? "").trim();
  if (!price && isEdit) {
    price = String(existing?.price ?? "").trim();
  }
  if (!price && required) {
    throw new HttpError(400, "Narx to'ldirilishi shart", "VALIDATION_ERROR");
  }

  const originalPrice = String(body?.originalPrice ?? "").trim();
  const discount = normalizeOptionalI18nPair(body?.discount);
  const video = String(body?.video ?? "").trim();
  const labels = normalizeLabelDraft(body?.labels);
  const relatedGroups = normalizeRelatedGroups(body?.relatedGroups, productId);
  const categoryFields = await resolveProductCategory(body, { required, existing });
  const countries = await normalizeProductCountries(body, { required, existing });

  let countryFilterRaw =
    String(body?.productCountry ?? "").trim() || String(body?.countriesCategories ?? "").trim();
  if (!countryFilterRaw && isEdit) {
    countryFilterRaw =
      String(existing?.productCountry ?? "").trim() ||
      String(existing?.countriesCategories ?? "").trim();
  }
  const countryFilterValue = await normalizeCountryFilterField(countryFilterRaw);

  let brandRaw = String(body?.brandCategories ?? "").trim();
  if (!brandRaw && isEdit) {
    brandRaw = String(existing?.brandCategories ?? "").trim();
  }
  const brandCategories = await normalizeBrandCategories({ brandCategories: brandRaw });

  let productTypeRaw = String(body?.productType ?? "").trim();
  if (!productTypeRaw && isEdit) {
    productTypeRaw = String(existing?.productType ?? "").trim();
  }
  const productType = await normalizeProductTypeValue(productTypeRaw);

  const colors = Array.isArray(body?.colors) ? body.colors : [];
  let mainImage = String(body?.mainImage ?? "").trim();
  if (!mainImage && colors.length === 0 && isEdit) {
    mainImage = String(existing?.mainImage || existing?.image || "").trim();
  }
  const thumbnails = normalizeStringArray(body?.thumbnails);

  if (colors.length === 0 && !mainImage && required) {
    throw new HttpError(400, "Asosiy rasm (mainImage) yuklanishi shart", "VALIDATION_ERROR");
  }

  const payload = {
    categoryName,
    title,
    price: price || String(existing?.price || "").trim(),
    originalPrice: originalPrice || undefined,
    discount: discount || undefined,
    video: video || undefined,
    labels,
    relatedGroups,
    category: categoryFields.category,
    masterCategoryId: categoryFields.masterCategoryId,
    countries,
    countriesCategories: countryFilterValue,
    productCountry: countryFilterValue,
    brandCategories,
    productType,
    sellerId: String(sellerShopId || "").trim(),
    mainImage: mainImage || undefined,
    image: String(body?.image ?? mainImage).trim() || undefined,
    thumbnails: colors.length > 0 ? [] : thumbnails,
    colors,
  };

  const weight = normalizeWeight(body?.weight);
  if (weight != null) {
    payload.weight = weight;
  } else if (isEdit && Number.isFinite(Number(existing?.weight)) && Number(existing.weight) > 0) {
    payload.weight = Math.floor(Number(existing.weight));
  }

  const description = Array.isArray(body?.description) ? body.description : [];
  if (description.length > 0) payload.description = description;

  const descriptionImages = normalizeStringArray(body?.descriptionImages);
  if (descriptionImages.length > 0) payload.descriptionImages = descriptionImages;

  const sizeChart = normalizeOptionalObject(body?.sizeChart);
  if (sizeChart) payload.sizeChart = sizeChart;

  if (colors.length === 0) {
    for (const field of ["sizeStock", "modelStock", "storageStock"]) {
      const map = normalizeOptionalObject(body?.[field]);
      if (map && Object.keys(map).length > 0) {
        payload[field] = map;
      }
    }
  }

  if (!hasVariantStockData(payload)) {
    payload.quantity = 1;
  } else {
    delete payload.quantity;
  }

  const relatedIds = relatedGroups.flatMap((group) => group.productIds || []);
  await assertRelatedProductIdsForSeller(relatedIds, payload.sellerId, productId);

  return payload;
}

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

async function listSellerProducts(sellerShopId) {
  await assertSellerCanManageProducts(sellerShopId);
  const sellerId = String(sellerShopId || "").trim();

  const rows = await Product.find({ sellerId })
    .select({
      id: 1,
      title: 1,
      price: 1,
      originalPrice: 1,
      mainImage: 1,
      image: 1,
      categoryName: 1,
      clientActive: 1,
      pausedBySeller: 1,
      approvalStatus: 1,
      cargoExpressPolicy: 1,
      colors: 1,
    })
    .sort({ _id: -1 })
    .lean();

  return keepNewestProductPerId(rows).map((product) => {
    const firstColor = Array.isArray(product.colors) ? product.colors[0] : null;
    const image = product.image || product.mainImage || firstColor?.mainImage || "";
    const approvalStatus =
      normalizeApprovalStatus(product.approvalStatus) || PRODUCT_APPROVAL_STATUS.APPROVED;
    return {
      id: product.id,
      title: product.title || { uz: "", ru: "" },
      price: firstColor?.price || product.price || "",
      originalPrice: firstColor?.originalPrice || product.originalPrice || "",
      image,
      imageUrl: resolvePublicAssetUrl(image),
      categoryName: product.categoryName || "",
      clientActive: product.clientActive !== false,
      pausedBySeller: Boolean(product.pausedBySeller),
      approvalStatus,
      cargoExpressPolicy: product.cargoExpressPolicy ?? null,
    };
  });
}

async function getSellerProductById(sellerShopId, productIdRaw) {
  await assertSellerCanManageProducts(sellerShopId);
  const productId = parseProductId(productIdRaw);
  const product = await assertSellerOwnsProduct(sellerShopId, productId);
  return product;
}

async function createSellerProduct(sellerShopId, body) {
  const seller = await assertSellerCanManageProducts(sellerShopId);
  const payload = await normalizeSellerProductPayload(body, { sellerShopId });
  const pipelineMode = resolveSellerPipelineMode(seller.sellerCountry);
  Object.assign(payload, buildCreateApprovalFields(pipelineMode));
  const created = await createProduct(payload);
  return created;
}

async function updateSellerProduct(sellerShopId, productIdRaw, body) {
  await assertSellerCanManageProducts(sellerShopId);
  const productId = parseProductId(productIdRaw);
  const existing = await assertSellerOwnsProduct(sellerShopId, productId);
  const payload = await normalizeSellerProductPayload(body, {
    sellerShopId,
    productId,
    existing,
  });

  // Seller approval / cargo siyosatini o'zgartira olmaydi
  delete payload.clientActive;
  delete payload.pausedBySeller;
  delete payload.approvalStatus;
  delete payload.cargoExpressPolicy;
  delete payload.reviewedAt;
  delete payload.rejectionReason;

  const updateDoc = { $set: payload };
  const unset = {};

  if (Array.isArray(payload.colors) && payload.colors.length > 0) {
    unset.sizeStock = "";
    unset.modelStock = "";
    unset.storageStock = "";
  } else {
    if (!payload.sizeStock) unset.sizeStock = "";
    if (!payload.modelStock) unset.modelStock = "";
    if (!payload.storageStock) unset.storageStock = "";
  }

  if (!payload.description) unset.description = "";
  if (!payload.descriptionImages) unset.descriptionImages = "";
  if (!payload.sizeChart) unset.sizeChart = "";
  if (!payload.discount) unset.discount = "";
  if (!payload.originalPrice) unset.originalPrice = "";
  if (!payload.video) unset.video = "";

  if (Object.keys(unset).length > 0) {
    updateDoc.$unset = unset;
  }

  await Product.updateOne({ _id: existing._id }, updateDoc);
  return getSellerProductById(sellerShopId, productId);
}

async function deleteSellerProduct(sellerShopId, productIdRaw) {
  await assertSellerCanManageProducts(sellerShopId);
  const productId = parseProductId(productIdRaw);
  await assertSellerOwnsProduct(sellerShopId, productId);
  await Product.deleteMany({ id: productId });
  return { id: productId };
}

async function setSellerProductClientActive(sellerShopId, productIdRaw, clientActiveRaw) {
  await assertSellerCanManageProducts(sellerShopId);
  const productId = parseProductId(productIdRaw);
  const existing = await assertSellerOwnsProduct(sellerShopId, productId);

  const approvalStatus = normalizeApprovalStatus(existing.approvalStatus);
  if (approvalStatus === PRODUCT_APPROVAL_STATUS.PENDING) {
    throw new HttpError(
      403,
      "Mahsulot hali asosiy admin tasdiqlashi kutilmoqda",
      "PRODUCT_PENDING_APPROVAL",
    );
  }

  const clientActive = clientActiveRaw !== false;
  const sellerId = String(sellerShopId || "").trim();

  await Product.updateMany(
    { id: productId, sellerId },
    {
      $set: {
        clientActive,
        pausedBySeller: !clientActive,
      },
    },
  );

  return {
    id: productId,
    clientActive,
    pausedBySeller: !clientActive,
  };
}

module.exports = {
  listSellerProducts,
  getSellerProductById,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  setSellerProductClientActive,
};
