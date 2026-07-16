const { SellerWithdrawal } = require("../../models/sellerWithdrawal");
const { SellerPaymentRequest } = require("../../models/sellerPaymentRequest");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

const DEFAULT_PAGE_SIZE = 10;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function buildWithdrawnAtRange(query = {}) {
  const dateFrom = parseDateBoundary(query.dateFrom, false);
  const dateTo = parseDateBoundary(query.dateTo, true);
  if (!dateFrom && !dateTo) return null;

  const withdrawnAt = {};
  if (dateFrom) withdrawnAt.$gte = dateFrom;
  if (dateTo) withdrawnAt.$lte = dateTo;
  return withdrawnAt;
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

function resolveRequestSubmittedAt(request) {
  return request?.submittedAt || request?.createdAt || null;
}

function buildEmptyPage(page, limit) {
  return {
    page,
    limit,
    total: 0,
    totalPages: 1,
    withdrawals: [],
  };
}

async function resolveProductIdsBySearch(search) {
  const query = String(search || "").trim();
  if (!query) return null;

  const regex = new RegExp(escapeRegex(query), "i");
  const products = await Product.find({
    $or: [{ "title.uz": regex }, { "title.ru": regex }],
  })
    .select({ id: 1 })
    .lean();

  return products.map((product) => Number(product.id)).filter(Number.isFinite);
}

async function listSellerWithdrawals(sellerId, query = {}) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(50, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const withdrawnAtRange = buildWithdrawnAtRange(query);
  const search = String(query.search || "").trim();
  const productIdsBySearch = await resolveProductIdsBySearch(search);

  if (search && productIdsBySearch && !productIdsBySearch.length) {
    const requestCodeRegex = new RegExp(escapeRegex(search), "i");
    const matchByCode = {
      sellerId: normalizedSellerId,
      requestCode: requestCodeRegex,
    };
    if (withdrawnAtRange) matchByCode.withdrawnAt = withdrawnAtRange;

    const [totalByCode, rowsByCode] = await Promise.all([
      SellerWithdrawal.countDocuments(matchByCode),
      SellerWithdrawal.find(matchByCode)
        .sort({ withdrawnAt: -1, id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    if (!rowsByCode.length) return buildEmptyPage(page, limit);

    return mapWithdrawalPage(rowsByCode, totalByCode, page, limit);
  }

  const match = { sellerId: normalizedSellerId };
  if (withdrawnAtRange) match.withdrawnAt = withdrawnAtRange;
  if (productIdsBySearch) {
    match.$or = [
      { productId: { $in: productIdsBySearch } },
      { requestCode: new RegExp(escapeRegex(search), "i") },
    ];
  }

  const [total, rows] = await Promise.all([
    SellerWithdrawal.countDocuments(match),
    SellerWithdrawal.find(match)
      .sort({ withdrawnAt: -1, id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return mapWithdrawalPage(rows, total, page, limit);
}

async function mapWithdrawalPage(rows, total, page, limit) {
  const productIds = [...new Set(rows.map((row) => Number(row.productId)).filter(Number.isFinite))];
  const paymentRequestIds = [
    ...new Set(rows.map((row) => Number(row.paymentRequestId)).filter(Number.isFinite)),
  ];

  const [products, paymentRequests] = await Promise.all([
    productIds.length
      ? Product.find({ id: { $in: productIds } })
          .select({ id: 1, title: 1, image: 1, mainImage: 1, colors: 1 })
          .lean()
      : [],
    paymentRequestIds.length
      ? SellerPaymentRequest.find({ id: { $in: paymentRequestIds } })
          .select({ id: 1, submittedAt: 1, createdAt: 1 })
          .lean()
      : [],
  ]);

  const productById = new Map(products.map((product) => [Number(product.id), product]));
  const requestById = new Map(paymentRequests.map((row) => [Number(row.id), row]));

  const withdrawals = rows.map((row) => {
    const product = productById.get(Number(row.productId));
    const paymentRequest = requestById.get(Number(row.paymentRequestId));

    return {
      id: Number(row.id),
      paymentRequestId: Number(row.paymentRequestId),
      requestCode: String(row.requestCode || ""),
      soldItemId: Number(row.soldItemId),
      productId: Number(row.productId),
      productCode: `#${Number(row.productId)}`,
      title: resolveProductTitle(product),
      imageUrl: resolveProductImage(product),
      amount: toNumber(row.amount, 0),
      submittedAt: row.submittedAt || resolveRequestSubmittedAt(paymentRequest),
      withdrawnAt: row.withdrawnAt,
    };
  });

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    withdrawals,
  };
}

module.exports = {
  listSellerWithdrawals,
};
