const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { ensureSellerSoldItemsSynced } = require("./sellerSoldItemsSyncService");

const VALID_STATUSES = new Set(["available", "in_process", "withdrawn", "rejected"]);

function cleanSellerId(value) {
  return String(value || "").trim();
}

function parseStatusFilter(raw) {
  const status = String(raw || "all").trim();
  if (status === "all") return "";
  if (!VALID_STATUSES.has(status)) {
    throw new HttpError(400, "Status filter noto'g'ri", "VALIDATION_ERROR");
  }
  return status;
}

function parseDateBoundary(raw, endOfDay = false) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    throw new HttpError(400, "Sana formati noto'g'ri", "VALIDATION_ERROR");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new HttpError(400, "Sana formati noto'g'ri", "VALIDATION_ERROR");
  }

  if (endOfDay) {
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function buildSoldAtRange(query = {}) {
  const dateFrom = parseDateBoundary(query.dateFrom, false);
  const dateTo = parseDateBoundary(query.dateTo, true);
  if (!dateFrom && !dateTo) return null;

  const soldAt = {};
  if (dateFrom) soldAt.$gte = dateFrom;
  if (dateTo) soldAt.$lte = dateTo;
  return soldAt;
}

function resolveProductImage(product) {
  const image = product?.image || product?.mainImage || product?.colors?.[0]?.mainImage || "";
  return resolvePublicAssetUrl(String(image || "").trim() || "/img/no-image.png");
}

function resolveProductTitle(product) {
  const title = product?.title;
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  return { uz: String(title || "").trim(), ru: String(title || "").trim() };
}

async function sumAmountByStatus(sellerId, status) {
  const rows = await SellerSoldItem.aggregate([
    { $match: { sellerId, status } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return toNumber(rows[0]?.total, 0);
}

async function buildSellerEarningsSummary(sellerId) {
  await ensureSellerSoldItemsSynced();
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const [availableAmount, inProcessAmount, withdrawnAmount] = await Promise.all([
    sumAmountByStatus(normalizedSellerId, "available"),
    sumAmountByStatus(normalizedSellerId, "in_process"),
    sumAmountByStatus(normalizedSellerId, "withdrawn"),
  ]);

  return {
    availableAmount,
    inProcessAmount,
    withdrawnAmount,
  };
}

async function listSellerSoldItems(sellerId, query = {}) {
  await ensureSellerSoldItemsSynced();
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const status = parseStatusFilter(query.status);
  const soldAtRange = buildSoldAtRange(query);
  const match = { sellerId: normalizedSellerId };
  if (status) match.status = status;
  if (soldAtRange) match.soldAt = soldAtRange;

  const rows = await SellerSoldItem.find(match)
    .sort({ soldAt: -1, id: -1 })
    .lean();

  const productIds = [...new Set(rows.map((row) => Number(row.productId)).filter(Number.isFinite))];
  const products = productIds.length
    ? await Product.find({ id: { $in: productIds } })
        .select({ id: 1, title: 1, image: 1, mainImage: 1, colors: 1 })
        .lean()
    : [];

  const productById = new Map(products.map((product) => [Number(product.id), product]));

  return rows.map((row) => {
    const product = productById.get(Number(row.productId));
    const title = resolveProductTitle(product);

    return {
      id: Number(row.id),
      orderId: Number(row.orderId),
      productId: Number(row.productId),
      productCode: `#${Number(row.productId)}`,
      title,
      imageUrl: resolveProductImage(product),
      soldAt: row.soldAt,
      price: toNumber(row.price, 0),
      amount: toNumber(row.amount, 0),
      status: String(row.status || "available"),
    };
  });
}

async function submitSellerWithdrawalRequest(sellerId, payload = {}) {
  await ensureSellerSoldItemsSynced();
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const itemIds = [...new Set(
    (Array.isArray(payload.itemIds) ? payload.itemIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
  )];

  if (!itemIds.length) {
    throw new HttpError(400, "Kamida bitta mahsulot tanlanishi kerak", "VALIDATION_ERROR");
  }

  const rows = await SellerSoldItem.find({
    id: { $in: itemIds },
    sellerId: normalizedSellerId,
  }).lean();

  if (rows.length !== itemIds.length) {
    throw new HttpError(404, "Tanlangan mahsulotlardan ba'zilari topilmadi", "NOT_FOUND");
  }

  const invalidRow = rows.find((row) => String(row.status) !== "available");
  if (invalidRow) {
    throw new HttpError(
      409,
      "Faqat mavjud holatdagi mahsulotlar uchun so'rov yuborish mumkin",
      "CONFLICT",
    );
  }

  await SellerSoldItem.updateMany(
    {
      id: { $in: itemIds },
      sellerId: normalizedSellerId,
      status: "available",
    },
    {
      $set: { status: "in_process" },
    },
  );

  const summary = await buildSellerEarningsSummary(normalizedSellerId);
  return {
    updatedCount: itemIds.length,
    summary,
  };
}

module.exports = {
  buildSellerEarningsSummary,
  listSellerSoldItems,
  submitSellerWithdrawalRequest,
};
