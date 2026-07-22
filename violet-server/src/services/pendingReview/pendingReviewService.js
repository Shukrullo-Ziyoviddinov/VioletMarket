const mongoose = require("mongoose");
const { PendingReview } = require("../../models/pendingReview");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const {
  getProductDisplayTitle,
  getProductDisplayImage,
} = require("./pendingReviewHelpers");

function toUserObjectId(userId) {
  if (!userId) {
    throw new HttpError(401, "Avtorizatsiya talab qilinadi", "UNAUTHORIZED");
  }
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  const idStr = String(userId);
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    throw new HttpError(400, "Foydalanuvchi ID noto'g'ri", "INVALID_USER_ID");
  }
  return new mongoose.Types.ObjectId(idStr);
}

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

function mapPendingRowToClient(row, product) {
  const titleFromProduct = product ? getProductDisplayTitle(product) : null;
  return {
    id: String(row._id),
    productId: String(row.productId),
    orderDate: row.orderDate,
    productTitle: titleFromProduct || { uz: "Mahsulot", ru: "Mahsulot" },
    productImage: product ? getProductDisplayImage(product) : null,
  };
}

async function listPendingForUser(userId) {
  const uid = toUserObjectId(userId);
  const rows = await PendingReview.find({ userId: uid, status: "pending" })
    .sort({ orderDate: -1 })
    .lean();

  if (rows.length === 0) {
    return { items: [] };
  }

  const productIds = [...new Set(rows.map((r) => r.productId))];
  const products = await Product.find({ id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const items = rows.map((row) =>
    mapPendingRowToClient(row, productMap.get(row.productId) || null),
  );

  return { items };
}

async function createPendingBatch(userId, payload) {
  const uid = toUserObjectId(userId);
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  if (rawItems.length === 0) {
    return { items: [], created: 0 };
  }

  const productIds = [];
  for (const item of rawItems) {
    const productId = parseProductId(item.productId ?? item.id);
    productIds.push(productId);
  }

  const orderDate = new Date();
  const docs = productIds.map((productId) => ({
    userId: uid,
    productId,
    orderDate,
    status: "pending",
  }));

  if (docs.length === 0) {
    return { items: [], created: 0 };
  }

  await PendingReview.insertMany(docs);
  return listPendingForUser(userId).then((data) => ({
    ...data,
    created: docs.length,
  }));
}

/**
 * Topshirdim: mijoz profilida «kutilayotgan izoh» uchun yozuv.
 * Bir xil mahsulot uchun pending bo‘lsa — qayta yozilmaydi.
 */
async function ensurePendingReviewForDeliveredProduct(userId, productIdRaw, orderDate = new Date()) {
  if (!userId) return null;
  const uid = toUserObjectId(userId);
  const productId = parseProductId(productIdRaw);

  const existing = await PendingReview.findOne({
    userId: uid,
    productId,
    status: "pending",
  }).lean();
  if (existing) return existing;

  const created = await PendingReview.create({
    userId: uid,
    productId,
    orderDate: orderDate instanceof Date ? orderDate : new Date(orderDate),
    status: "pending",
  });
  return created;
}

async function completePendingReview(userId, pendingReviewIdRaw) {
  if (!pendingReviewIdRaw) return;

  const uid = toUserObjectId(userId);
  const idStr = String(pendingReviewIdRaw);
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    throw new HttpError(400, "Kutilmagan sharh ID", "INVALID_PENDING_REVIEW_ID");
  }

  const row = await PendingReview.findOne({
    _id: new mongoose.Types.ObjectId(idStr),
    userId: uid,
    status: "pending",
  });

  if (!row) {
    throw new HttpError(404, "Kutilmagan sharh topilmadi", "PENDING_REVIEW_NOT_FOUND");
  }

  row.status = "completed";
  await row.save();
}

module.exports = {
  listPendingForUser,
  createPendingBatch,
  ensurePendingReviewForDeliveredProduct,
  completePendingReview,
};
