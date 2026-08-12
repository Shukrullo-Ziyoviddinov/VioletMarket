const { Product } = require("../../models/product");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { isSellerAccountPaused } = require("../../utils/sellerAccountStatus");
const {
  PRODUCT_APPROVAL_STATUS,
  requireCargoExpressPolicy,
  normalizeApprovalStatus,
} = require("../../utils/productApproval");

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

function localizeTitle(title) {
  if (typeof title === "string") return title;
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  return { uz: "", ru: "" };
}

function mapPendingProductCard(product, sellerMap) {
  const firstColor = Array.isArray(product.colors) ? product.colors[0] : null;
  const sellerId = String(product.sellerId || "").trim();
  const image = product.image || product.mainImage || firstColor?.mainImage || "";
  const seller = sellerId ? sellerMap.get(sellerId) : null;

  return {
    id: product.id,
    title: localizeTitle(product.title),
    description: Array.isArray(product.description) ? product.description : [],
    price: firstColor?.price || product.price || "",
    originalPrice: firstColor?.originalPrice || product.originalPrice || "",
    image,
    imageUrl: resolvePublicAssetUrl(image),
    countries: Array.isArray(product.countries) ? product.countries : [],
    countriesCategories: String(product.countriesCategories || "").trim(),
    productCountry: String(product.productCountry || "").trim(),
    categoryName: String(product.categoryName || "").trim(),
    approvalStatus: PRODUCT_APPROVAL_STATUS.PENDING,
    cargoExpressPolicy: product.cargoExpressPolicy ?? null,
    createdAt: product.createdAt || product._id?.getTimestamp?.() || null,
    sellerId: sellerId || null,
    seller: seller
      ? {
          id: seller.id,
          name: seller.name || "",
          logo: seller.logo || "",
          logoUrl: resolvePublicAssetUrl(seller.logo || ""),
          sellerCountry: String(seller.sellerCountry || "").trim().toLowerCase(),
        }
      : null,
  };
}

async function buildSellerMap(sellerIds) {
  const ids = [...new Set((sellerIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const sellers = await SellerAccount.find({ id: { $in: ids } })
    .select({ id: 1, name: 1, logo: 1, sellerCountry: 1 })
    .lean();

  return new Map(sellers.map((seller) => [seller.id, seller]));
}

async function listPendingProductsForAdmin() {
  const rows = await Product.find({
    approvalStatus: PRODUCT_APPROVAL_STATUS.PENDING,
  })
    .select({
      id: 1,
      title: 1,
      description: 1,
      price: 1,
      originalPrice: 1,
      image: 1,
      mainImage: 1,
      colors: 1,
      sellerId: 1,
      countries: 1,
      countriesCategories: 1,
      productCountry: 1,
      categoryName: 1,
      approvalStatus: 1,
      cargoExpressPolicy: 1,
      createdAt: 1,
    })
    .sort({ _id: -1 })
    .lean();

  const unique = keepNewestProductPerId(rows);
  const sellerMap = await buildSellerMap(unique.map((p) => p.sellerId));

  return {
    pending: unique.map((product) => mapPendingProductCard(product, sellerMap)),
  };
}

async function approvePendingProduct(productIdRaw, cargoExpressPolicyRaw) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const status = normalizeApprovalStatus(existing.approvalStatus);
  if (status !== PRODUCT_APPROVAL_STATUS.PENDING) {
    throw new HttpError(
      400,
      "Faqat kutilayotgan mahsulotni tasdiqlash mumkin",
      "INVALID_STATUS",
    );
  }

  const cargoExpressPolicy = requireCargoExpressPolicy(cargoExpressPolicyRaw);
  const reviewedAt = new Date();

  const sellerId = String(existing.sellerId || "").trim();
  let sellerPaused = false;
  if (sellerId) {
    const seller = await SellerAccount.findOne({ id: sellerId })
      .select({ id: 1, status: 1 })
      .lean();
    sellerPaused = isSellerAccountPaused(seller?.status);
  }

  // Siller pauzada bo'lsa tasdiqlash mumkin, lekin saytda chiqmasin.
  // pausedBySeller: true → siller qayta ochilganda activateProductsForSeller uni yoqadi.
  const clientActive = !sellerPaused;
  const pausedBySeller = sellerPaused;

  await Product.updateMany(
    { id: productId },
    {
      $set: {
        approvalStatus: PRODUCT_APPROVAL_STATUS.APPROVED,
        clientActive,
        pausedBySeller,
        cargoExpressPolicy,
        reviewedAt,
      },
      $unset: { rejectionReason: "" },
    },
  );

  return {
    id: productId,
    approvalStatus: PRODUCT_APPROVAL_STATUS.APPROVED,
    clientActive,
    pausedBySeller,
    sellerPaused,
    cargoExpressPolicy,
    reviewedAt,
  };
}

/**
 * Rad etish: kelishuv bo'yicha DB dan o'chirish (pending_then_delete).
 */
async function rejectPendingProduct(productIdRaw, reasonRaw) {
  const productId = parseProductId(productIdRaw);
  const existing = await findNewestProductDoc(productId);
  if (!existing) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const status = normalizeApprovalStatus(existing.approvalStatus);
  if (status !== PRODUCT_APPROVAL_STATUS.PENDING) {
    throw new HttpError(
      400,
      "Faqat kutilayotgan mahsulotni rad etish mumkin",
      "INVALID_STATUS",
    );
  }

  const reason = String(reasonRaw || "").trim();
  await Product.deleteMany({ id: productId });

  return {
    id: productId,
    deleted: true,
    rejectionReason: reason || null,
  };
}

module.exports = {
  listPendingProductsForAdmin,
  approvePendingProduct,
  rejectPendingProduct,
};
