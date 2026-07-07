const { SellerWithdrawal } = require("../../models/sellerWithdrawal");
const { SellerPaymentRequest } = require("../../models/sellerPaymentRequest");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { SellerAccount } = require("../../models/sellerAccount");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("../../productManagement/recordSellerSales");
const { nextSequence } = require("../../models/autoIncrement");

const DEFAULT_PAGE_SIZE = 10;

function cleanSellerId(value) {
  return String(value || "").trim();
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

function resolveSellerDisplayName(account) {
  return String(account?.name?.uz || account?.name?.ru || account?.id || "").trim();
}

async function backfillWithdrawalsFromApprovedRequests() {
  const approvedRequests = await SellerPaymentRequest.find({ status: "withdrawn" })
    .sort({ reviewedAt: 1, id: 1 })
    .lean();

  if (!approvedRequests.length) return 0;

  let createdCount = 0;
  for (const request of approvedRequests) {
    const exists = await SellerWithdrawal.exists({ paymentRequestId: Number(request.id) });
    if (exists) continue;

    const items = await SellerSoldItem.find({ paymentRequestId: Number(request.id) }).lean();
    if (!items.length) continue;

    const withdrawnAt = request.reviewedAt || new Date();
    const periodKeys = getPeriodKeysFromPaidAt(withdrawnAt);
    const requestCode = String(request.requestCode || `PR-${String(request.id).padStart(5, "0")}`);

    const docs = [];
    for (const item of items) {
      const id = await nextSequence("seller_withdrawal_id");
      docs.push({
        id,
        paymentRequestId: Number(request.id),
        requestCode,
        sellerId: cleanSellerId(request.sellerId),
        soldItemId: Number(item.id),
        productId: Number(item.productId),
        amount: toNumber(item.amount, 0),
        withdrawnAt,
        dateKey: periodKeys.dateKey,
        weekKey: periodKeys.weekKey,
        monthKey: periodKeys.monthKey,
      });
    }

    if (docs.length) {
      await SellerWithdrawal.insertMany(docs, { ordered: false }).catch(() => null);
      createdCount += docs.length;
    }
  }

  return createdCount;
}

async function buildWithdrawalStats() {
  await backfillWithdrawalsFromApprovedRequests();

  const [amountRows, requestRows] = await Promise.all([
    SellerWithdrawal.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, productCount: { $sum: 1 } } },
    ]),
    SellerWithdrawal.distinct("paymentRequestId"),
  ]);

  return {
    withdrawnCount: requestRows.length,
    withdrawnProductCount: toNumber(amountRows[0]?.productCount, 0),
    withdrawnAmount: toNumber(amountRows[0]?.totalAmount, 0),
  };
}

async function recordWithdrawalsForPaymentRequest(paymentRequest, itemRows, withdrawnAt) {
  const request = paymentRequest || {};
  const rows = Array.isArray(itemRows) ? itemRows : [];
  if (!rows.length) return [];

  const reviewedAt = withdrawnAt || new Date();
  const periodKeys = getPeriodKeysFromPaidAt(reviewedAt);
  const paymentRequestId = Number(request.id);
  const requestCode = String(request.requestCode || `PR-${String(paymentRequestId).padStart(5, "0")}`);
  const sellerId = cleanSellerId(request.sellerId);

  const docs = [];
  for (const item of rows) {
    const soldItemId = Number(item.id);
    const existing = await SellerWithdrawal.findOne({ paymentRequestId, soldItemId }).lean();
    if (existing) continue;

    const id = await nextSequence("seller_withdrawal_id");
    docs.push({
      id,
      paymentRequestId,
      requestCode,
      sellerId,
      soldItemId,
      productId: Number(item.productId),
      amount: toNumber(item.amount, 0),
      withdrawnAt: reviewedAt,
      dateKey: periodKeys.dateKey,
      weekKey: periodKeys.weekKey,
      monthKey: periodKeys.monthKey,
    });
  }

  if (!docs.length) return [];

  await SellerWithdrawal.insertMany(docs);
  return docs;
}

async function listWithdrawalSellerOptions() {
  const sellerIds = await SellerWithdrawal.distinct("sellerId");
  if (!sellerIds.length) return [];

  const accounts = await SellerAccount.find({ id: { $in: sellerIds } })
    .select({ id: 1, name: 1, logo: 1 })
    .lean();

  const accountById = new Map(accounts.map((row) => [String(row.id), row]));

  return sellerIds
    .map((sellerId) => {
      const account = accountById.get(String(sellerId));
      return {
        sellerId: String(sellerId),
        name: resolveSellerDisplayName(account) || String(sellerId),
        logoUrl: resolvePublicAssetUrl(account?.logo || ""),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "uz"));
}

async function listWithdrawals(query = {}) {
  await backfillWithdrawalsFromApprovedRequests();

  const sellerId = cleanSellerId(query.sellerId);
  const withdrawnAtRange = buildWithdrawnAtRange(query);
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(50, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));

  const match = {};
  if (sellerId) match.sellerId = sellerId;
  if (withdrawnAtRange) match.withdrawnAt = withdrawnAtRange;

  const [total, rows] = await Promise.all([
    SellerWithdrawal.countDocuments(match),
    SellerWithdrawal.find(match)
      .sort({ withdrawnAt: -1, id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const sellerIds = [...new Set(rows.map((row) => cleanSellerId(row.sellerId)).filter(Boolean))];
  const productIds = [...new Set(rows.map((row) => Number(row.productId)).filter(Number.isFinite))];
  const paymentRequestIds = [
    ...new Set(rows.map((row) => Number(row.paymentRequestId)).filter(Number.isFinite)),
  ];

  const [accounts, products, paymentRequests] = await Promise.all([
    sellerIds.length
      ? SellerAccount.find({ id: { $in: sellerIds } })
          .select({ id: 1, name: 1, logo: 1 })
          .lean()
      : [],
    productIds.length
      ? Product.find({ id: { $in: productIds } })
          .select({ id: 1, title: 1, image: 1, mainImage: 1, colors: 1 })
          .lean()
      : [],
    paymentRequestIds.length
      ? SellerPaymentRequest.find({ id: { $in: paymentRequestIds } })
          .select({ id: 1, submittedAt: 1 })
          .lean()
      : [],
  ]);

  const accountById = new Map(accounts.map((row) => [String(row.id), row]));
  const productById = new Map(products.map((product) => [Number(product.id), product]));
  const requestById = new Map(paymentRequests.map((row) => [Number(row.id), row]));

  const withdrawals = rows.map((row) => {
    const account = accountById.get(cleanSellerId(row.sellerId));
    const product = productById.get(Number(row.productId));
    const paymentRequest = requestById.get(Number(row.paymentRequestId));

    return {
      id: Number(row.id),
      paymentRequestId: Number(row.paymentRequestId),
      requestCode: String(row.requestCode || ""),
      sellerId: cleanSellerId(row.sellerId),
      sellerName: resolveSellerDisplayName(account) || cleanSellerId(row.sellerId),
      sellerLogoUrl: resolvePublicAssetUrl(account?.logo || ""),
      soldItemId: Number(row.soldItemId),
      productId: Number(row.productId),
      productCode: `#${Number(row.productId)}`,
      title: resolveProductTitle(product),
      imageUrl: resolveProductImage(product),
      amount: toNumber(row.amount, 0),
      submittedAt: paymentRequest?.submittedAt || null,
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
  buildWithdrawalStats,
  recordWithdrawalsForPaymentRequest,
  listWithdrawalSellerOptions,
  listWithdrawals,
  backfillWithdrawalsFromApprovedRequests,
};
