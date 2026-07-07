const { SellerPaymentRequest } = require("../../models/sellerPaymentRequest");
const { SellerSoldItem } = require("../../models/sellerSoldItem");
const { SellerAccount } = require("../../models/sellerAccount");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { getPeriodKeysFromPaidAt } = require("../../productManagement/recordSellerSales");
const { nextSequence } = require("../../models/autoIncrement");

const VALID_STATUSES = new Set(["in_process", "withdrawn", "rejected"]);
const DEFAULT_PAGE_SIZE = 10;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function buildRequestCode(id) {
  return `PR-${String(id).padStart(5, "0")}`;
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

function buildSubmittedAtRange(query = {}) {
  const dateFrom = parseDateBoundary(query.dateFrom, false);
  const dateTo = parseDateBoundary(query.dateTo, true);
  if (!dateFrom && !dateTo) return null;

  const submittedAt = {};
  if (dateFrom) submittedAt.$gte = dateFrom;
  if (dateTo) submittedAt.$lte = dateTo;
  return submittedAt;
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

async function backfillOrphanInProcessItems() {
  const orphanRows = await SellerSoldItem.find({
    status: "in_process",
    $or: [{ paymentRequestId: null }, { paymentRequestId: { $exists: false } }],
  })
    .sort({ soldAt: 1, id: 1 })
    .lean();

  if (!orphanRows.length) return 0;

  const groupedBySeller = new Map();
  for (const row of orphanRows) {
    const sellerId = cleanSellerId(row.sellerId);
    if (!sellerId) continue;
    if (!groupedBySeller.has(sellerId)) groupedBySeller.set(sellerId, []);
    groupedBySeller.get(sellerId).push(row);
  }

  let createdCount = 0;
  for (const [sellerId, rows] of groupedBySeller.entries()) {
    const submittedAt = rows[0]?.soldAt || new Date();
    const periodKeys = getPeriodKeysFromPaidAt(submittedAt);
    const totalAmount = rows.reduce((sum, row) => sum + toNumber(row.amount, 0), 0);
    const id = await nextSequence("seller_payment_request_id");

    await SellerPaymentRequest.create({
      id,
      sellerId,
      requestCode: buildRequestCode(id),
      status: "in_process",
      totalAmount,
      itemCount: rows.length,
      submittedAt,
      reviewedAt: null,
      dateKey: periodKeys.dateKey,
      weekKey: periodKeys.weekKey,
      monthKey: periodKeys.monthKey,
    });

    await SellerSoldItem.updateMany(
      { id: { $in: rows.map((row) => row.id) } },
      { $set: { paymentRequestId: id, status: "in_process" } },
    );
    createdCount += 1;
  }

  return createdCount;
}

async function sumAmountByRequestStatus(status) {
  const rows = await SellerPaymentRequest.aggregate([
    { $match: { status } },
    { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
  ]);
  return {
    count: toNumber(rows[0]?.count, 0),
    totalAmount: toNumber(rows[0]?.total, 0),
  };
}

async function buildPaymentRequestStats() {
  await backfillOrphanInProcessItems();

  const [totalCount, inProcess, withdrawn, rejectedProducts] = await Promise.all([
    SellerPaymentRequest.countDocuments({}),
    sumAmountByRequestStatus("in_process"),
    sumAmountByRequestStatus("withdrawn"),
    buildRejectedProductsStats(),
  ]);

  return {
    totalCount,
    inProcessCount: inProcess.count,
    inProcessAmount: inProcess.totalAmount,
    withdrawnCount: withdrawn.count,
    withdrawnAmount: withdrawn.totalAmount,
    rejectedCount: rejectedProducts.rejectedEventCount,
    rejectedUniqueProductCount: rejectedProducts.uniqueProductCount,
    rejectedAmount: rejectedProducts.rejectedAmount,
  };
}

async function buildRejectedProductsStats() {
  const rows = await SellerSoldItem.find({
    "rejectionHistory.0": { $exists: true },
  })
    .select({ rejectionHistory: 1, amount: 1 })
    .lean();

  const rejectedEventCount = rows.reduce(
    (sum, row) => sum + (Array.isArray(row.rejectionHistory) ? row.rejectionHistory.length : 0),
    0,
  );
  const uniqueProductCount = rows.length;
  const rejectedAmount = rows.reduce((sum, row) => sum + toNumber(row.amount, 0), 0);

  return {
    rejectedEventCount,
    uniqueProductCount,
    rejectedAmount,
  };
}

async function listRejectedProducts() {
  const rows = await SellerSoldItem.find({
    "rejectionHistory.0": { $exists: true },
  })
    .sort({ updatedAt: -1, id: -1 })
    .lean();

  const sellerIds = [...new Set(rows.map((row) => cleanSellerId(row.sellerId)).filter(Boolean))];
  const productIds = [...new Set(rows.map((row) => Number(row.productId)).filter(Number.isFinite))];

  const [accounts, products] = await Promise.all([
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
  ]);

  const accountById = new Map(accounts.map((row) => [String(row.id), row]));
  const productById = new Map(products.map((product) => [Number(product.id), product]));

  return rows.map((row) => {
    const account = accountById.get(cleanSellerId(row.sellerId));
    const product = productById.get(Number(row.productId));
    const rejectionHistory = Array.isArray(row.rejectionHistory) ? row.rejectionHistory : [];
    const rejections = rejectionHistory
      .map((entry) => ({
        paymentRequestId: Number(entry.paymentRequestId) || null,
        rejectedAt: entry.rejectedAt,
        comment: String(entry.comment || "").trim(),
      }))
      .sort((a, b) => new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime());

    return {
      soldItemId: Number(row.id),
      productId: Number(row.productId),
      productCode: `#${Number(row.productId)}`,
      title: resolveProductTitle(product),
      imageUrl: resolveProductImage(product),
      sellerId: cleanSellerId(row.sellerId),
      sellerName: resolveSellerDisplayName(account) || cleanSellerId(row.sellerId),
      sellerLogoUrl: resolvePublicAssetUrl(account?.logo || ""),
      amount: toNumber(row.amount, 0),
      status: String(row.status || "available"),
      rejectionCount: rejections.length,
      rejections,
      isWithdrawn: String(row.status) === "withdrawn",
      withdrawnAt: row.withdrawnAt || null,
    };
  });
}

async function listPaymentRequestSellerOptions() {
  const sellerIds = await SellerPaymentRequest.distinct("sellerId");
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

async function listPaymentRequests(query = {}) {
  await backfillOrphanInProcessItems();

  const status = parseStatusFilter(query.status);
  const sellerId = cleanSellerId(query.sellerId);
  const submittedAtRange = buildSubmittedAtRange(query);
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(50, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));

  const match = {};
  if (status) match.status = status;
  if (sellerId) match.sellerId = sellerId;
  if (submittedAtRange) match.submittedAt = submittedAtRange;

  const [total, rows] = await Promise.all([
    SellerPaymentRequest.countDocuments(match),
    SellerPaymentRequest.find(match)
      .sort({ submittedAt: -1, id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const sellerIds = [...new Set(rows.map((row) => cleanSellerId(row.sellerId)).filter(Boolean))];
  const accounts = sellerIds.length
    ? await SellerAccount.find({ id: { $in: sellerIds } })
        .select({ id: 1, name: 1, logo: 1 })
        .lean()
    : [];
  const accountById = new Map(accounts.map((row) => [String(row.id), row]));

  const requests = rows.map((row) => {
    const account = accountById.get(cleanSellerId(row.sellerId));
    return {
      id: Number(row.id),
      requestCode: String(row.requestCode || buildRequestCode(row.id)),
      sellerId: cleanSellerId(row.sellerId),
      sellerName: resolveSellerDisplayName(account) || cleanSellerId(row.sellerId),
      sellerLogoUrl: resolvePublicAssetUrl(account?.logo || ""),
      status: String(row.status || "in_process"),
      rejectionComment: String(row.rejectionComment || "").trim() || null,
      totalAmount: toNumber(row.totalAmount, 0),
      itemCount: toNumber(row.itemCount, 0),
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt || null,
    };
  });

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    requests,
  };
}

async function loadPaymentRequestItems(paymentRequestId) {
  const rows = await SellerSoldItem.find({ paymentRequestId: Number(paymentRequestId) })
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
    return {
      id: Number(row.id),
      productId: Number(row.productId),
      productCode: `#${Number(row.productId)}`,
      title: resolveProductTitle(product),
      imageUrl: resolveProductImage(product),
      soldAt: row.soldAt,
      price: toNumber(row.price, 0),
      amount: toNumber(row.amount, 0),
      status: String(row.status || "in_process"),
      rejectionComment: String(row.rejectionComment || "").trim() || null,
    };
  });
}

async function getPaymentRequestByIdOrThrow(paymentRequestId) {
  const id = Number(paymentRequestId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(400, "paymentRequestId noto'g'ri", "VALIDATION_ERROR");
  }

  const row = await SellerPaymentRequest.findOne({ id }).lean();
  if (!row) {
    throw new HttpError(404, "To'lov so'rovi topilmadi", "NOT_FOUND");
  }

  return row;
}

async function getPaymentRequestDetail(paymentRequestId) {
  const row = await getPaymentRequestByIdOrThrow(paymentRequestId);
  const account = await SellerAccount.findOne({ id: cleanSellerId(row.sellerId) })
    .select({ id: 1, name: 1, logo: 1 })
    .lean();
  const items = await loadPaymentRequestItems(row.id);

  return {
    id: Number(row.id),
    requestCode: String(row.requestCode || buildRequestCode(row.id)),
    sellerId: cleanSellerId(row.sellerId),
    sellerName: resolveSellerDisplayName(account) || cleanSellerId(row.sellerId),
    sellerLogoUrl: resolvePublicAssetUrl(account?.logo || ""),
    status: String(row.status || "in_process"),
    totalAmount: toNumber(row.totalAmount, 0),
    itemCount: toNumber(row.itemCount, 0),
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt || null,
    rejectionComment: String(row.rejectionComment || "").trim() || null,
    items,
  };
}

async function approvePaymentRequest(paymentRequestId) {
  const row = await getPaymentRequestByIdOrThrow(paymentRequestId);
  if (String(row.status) !== "in_process") {
    throw new HttpError(409, "Faqat jarayondagi so'rov tasdiqlanadi", "CONFLICT");
  }

  const reviewedAt = new Date();
  await SellerPaymentRequest.updateOne(
    { id: row.id },
    { $set: { status: "withdrawn", reviewedAt } },
  );
  await SellerSoldItem.updateMany(
    { paymentRequestId: row.id },
    { $set: { status: "withdrawn", withdrawnAt: reviewedAt } },
  );

  return getPaymentRequestDetail(row.id);
}

async function rejectPaymentRequest(paymentRequestId, payload = {}) {
  const row = await getPaymentRequestByIdOrThrow(paymentRequestId);
  if (String(row.status) !== "in_process") {
    throw new HttpError(409, "Faqat jarayondagi so'rov rad etiladi", "CONFLICT");
  }

  const rejectionComment = String(payload.comment || "").trim();
  if (!rejectionComment) {
    throw new HttpError(400, "Rad etish sababi yozilishi shart", "VALIDATION_ERROR");
  }

  const reviewedAt = new Date();
  const rejectionEntry = {
    paymentRequestId: row.id,
    rejectedAt: reviewedAt,
    comment: rejectionComment,
  };

  await SellerPaymentRequest.updateOne(
    { id: row.id },
    { $set: { status: "rejected", reviewedAt, rejectionComment } },
  );

  const itemRows = await SellerSoldItem.find({ paymentRequestId: row.id })
    .select({ id: 1 })
    .lean();

  if (itemRows.length) {
    await SellerSoldItem.bulkWrite(
      itemRows.map((item) => ({
        updateOne: {
          filter: { id: item.id },
          update: {
            $set: { status: "rejected", rejectionComment },
            $push: { rejectionHistory: rejectionEntry },
          },
        },
      })),
    );
  }

  return getPaymentRequestDetail(row.id);
}

async function createSellerPaymentRequest(sellerId, itemRows) {
  const normalizedSellerId = cleanSellerId(sellerId);
  const rows = Array.isArray(itemRows) ? itemRows : [];
  if (!normalizedSellerId || !rows.length) {
    throw new HttpError(400, "So'rov yaratish uchun ma'lumot yetarli emas", "VALIDATION_ERROR");
  }

  const submittedAt = new Date();
  const periodKeys = getPeriodKeysFromPaidAt(submittedAt);
  const totalAmount = rows.reduce((sum, row) => sum + toNumber(row.amount, 0), 0);
  const id = await nextSequence("seller_payment_request_id");

  const paymentRequest = await SellerPaymentRequest.create({
    id,
    sellerId: normalizedSellerId,
    requestCode: buildRequestCode(id),
    status: "in_process",
    totalAmount,
    itemCount: rows.length,
    submittedAt,
    reviewedAt: null,
    dateKey: periodKeys.dateKey,
    weekKey: periodKeys.weekKey,
    monthKey: periodKeys.monthKey,
  });

  await SellerSoldItem.updateMany(
    { id: { $in: rows.map((row) => Number(row.id)) }, sellerId: normalizedSellerId },
    { $set: { status: "in_process", paymentRequestId: id, rejectionComment: null } },
  );

  return paymentRequest;
}

module.exports = {
  buildPaymentRequestStats,
  buildRejectedProductsStats,
  listRejectedProducts,
  listPaymentRequestSellerOptions,
  listPaymentRequests,
  getPaymentRequestDetail,
  approvePaymentRequest,
  rejectPaymentRequest,
  createSellerPaymentRequest,
  buildRequestCode,
};
