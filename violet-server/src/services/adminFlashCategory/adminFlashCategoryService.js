const { Product } = require("../../models/product");
const { SellerAccount } = require("../../models/sellerAccount");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { computeEffectiveQuantity } = require("../productService");
const { HttpError } = require("../../utils/httpError");
const { parseDurationHours, parseProductId } = require("../flashSaleCountdown/flashSaleCountdownHelpers");
const {
  FLASH_SECTION_CATEGORY_NAMES,
  FLASH_SECTION_CATEGORY_LABELS,
  normalizeFlashCategoryFlag,
} = require("./adminFlashCategoryConstants");
const { isFlashCategoryActive } = require("../../utils/flashCategoryProduct");

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

function mapSellerRow(seller) {
  if (!seller) return null;

  const logo = seller.logo || "";

  return {
    id: seller.id,
    name: seller.name,
    logo,
    logoUrl: resolvePublicAssetUrl(logo),
  };
}

function mapFlashProductRow(product, sellerMap) {
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
    seller: sellerId ? mapSellerRow(sellerMap.get(sellerId)) : null,
    categoryName: String(product.categoryName || "").trim(),
    flashCategoryName: normalizeFlashCategoryFlag(product.flashCategoryName),
    flashDurationHours: Number(product.flashDurationHours) || null,
  };
}

async function buildSellerMap() {
  const sellers = await SellerAccount.find()
    .select({ id: 1, name: 1, logo: 1 })
    .lean();

  return new Map(sellers.map((seller) => [seller.id, seller]));
}

async function findNewestProductDoc(productId) {
  const rows = await Product.find({ id: productId }).sort({ _id: -1 }).limit(1).lean();
  return rows[0] || null;
}

function parseCategoryName(raw) {
  const categoryName = String(raw || "").trim();
  if (!FLASH_SECTION_CATEGORY_NAMES.includes(categoryName)) {
    throw new HttpError(400, "Bo'lim nomi noto'g'ri", "INVALID_CATEGORY_NAME");
  }
  return categoryName;
}

async function listCategoryOptions() {
  return FLASH_SECTION_CATEGORY_NAMES.map((value) => ({
    value,
    label: FLASH_SECTION_CATEGORY_LABELS[value] || value,
  }));
}

async function listSellers() {
  const [rows, sellerMap] = await Promise.all([
    Product.find().select({ id: 1, sellerId: 1 }).sort({ _id: -1 }).lean(),
    buildSellerMap(),
  ]);

  const uniqueProducts = keepNewestProductPerId(rows);
  const sellerIds = new Set();

  for (const product of uniqueProducts) {
    const sellerId = String(product.sellerId || "").trim();
    if (sellerId) sellerIds.add(sellerId);
  }

  return [...sellerIds]
    .map((sellerId) => mapSellerRow(sellerMap.get(sellerId)))
    .filter(Boolean)
    .sort((left, right) =>
      String(left?.name?.uz || left?.name?.ru || "")
        .localeCompare(String(right?.name?.uz || right?.name?.ru || ""), "uz"),
    );
}

async function listSellerProducts(sellerIdRaw) {
  const sellerId = String(sellerIdRaw || "").trim();
  if (!sellerId) {
    throw new HttpError(400, "Sotuvchi ID kerak", "INVALID_SELLER_ID");
  }

  const [rows, sellerMap] = await Promise.all([
    Product.find({ sellerId })
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
        categoryName: 1,
        flashCategoryName: 1,
        flashDurationHours: 1,
      })
      .sort({ _id: -1 })
      .lean(),
    buildSellerMap(),
  ]);

  return keepNewestProductPerId(rows).map((product) => mapFlashProductRow(product, sellerMap));
}

async function listFlashProducts() {
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
        categoryName: 1,
        flashCategoryName: 1,
        flashDurationHours: 1,
      })
      .sort({ _id: -1 })
      .lean(),
    buildSellerMap(),
  ]);

  return keepNewestProductPerId(rows)
    .filter((product) => isFlashCategoryActive(product))
    .map((product) => mapFlashProductRow(product, sellerMap));
}

async function assignFlashProduct(body) {
  const productId = parseProductId(body?.productId);
  const flashDurationHours = parseDurationHours(body?.flashDurationHours);
  const flashCategoryName = normalizeFlashCategoryFlag(body?.flashCategoryName);

  if (productId == null) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  if (flashDurationHours == null) {
    throw new HttpError(400, "flashDurationHours noto'g'ri", "INVALID_DURATION");
  }
  if (flashCategoryName !== "true") {
    throw new HttpError(400, "flashCategoryName true bo'lishi kerak", "INVALID_FLASH_FLAG");
  }

  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  await Product.updateOne(
    { _id: existing._id },
    {
      $set: {
        flashDurationHours,
        flashCategoryName: "true",
      },
    },
  );

  const sellerMap = await buildSellerMap();
  const updated = await findNewestProductDoc(productId);
  return mapFlashProductRow(updated, sellerMap);
}

async function updateFlashDuration(productIdRaw, rawDurationHours) {
  const productId = parseProductId(productIdRaw);
  const flashDurationHours = parseDurationHours(rawDurationHours);

  if (productId == null) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  if (flashDurationHours == null) {
    throw new HttpError(400, "flashDurationHours noto'g'ri", "INVALID_DURATION");
  }

  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  if (!isFlashCategoryActive(existing)) {
    throw new HttpError(400, "Mahsulot katta chegirma ro'yxatida emas", "NOT_FLASH_PRODUCT");
  }

  await Product.updateOne(
    { _id: existing._id },
    {
      $set: {
        flashDurationHours,
      },
    },
  );

  const sellerMap = await buildSellerMap();
  const updated = await findNewestProductDoc(productId);
  return mapFlashProductRow(updated, sellerMap);
}

async function removeFlashProduct(productIdRaw) {
  const productId = parseProductId(productIdRaw);
  if (productId == null) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }

  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  await Product.updateOne(
    { _id: existing._id },
    {
      $set: {
        flashCategoryName: "false",
      },
    },
  );

  return {
    id: productId,
    flashCategoryName: "false",
  };
}

module.exports = {
  listCategoryOptions,
  listSellers,
  listSellerProducts,
  listFlashProducts,
  assignFlashProduct,
  updateFlashDuration,
  removeFlashProduct,
};
