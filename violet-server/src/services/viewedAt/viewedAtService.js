const mongoose = require("mongoose");
const { ViewedAt } = require("../../models/viewedAt");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { isProductActiveOnClient } = require("../../utils/productClientVisibility");
const {
  getProductDisplayName,
  getProductDisplayPrice,
} = require("./viewedAtHelpers");

const MAX_VIEWED = 20;

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

async function findNewestProductById(productId) {
  const rows = await Product.find({ id: productId }).sort({ _id: -1 }).limit(1).lean();
  return rows[0] || null;
}

function mapRowToClient(row) {
  return {
    productId: row.productId,
    name: row.name,
    price: row.price,
    viewedAt: row.viewedAt,
  };
}

async function listViewsForUser(userId) {
  const uid = toUserObjectId(userId);
  const rows = await ViewedAt.find({ userId: uid })
    .sort({ viewedAt: -1 })
    .limit(MAX_VIEWED)
    .lean();
  return { items: rows.map(mapRowToClient) };
}

async function getRecentProductIds(userId) {
  const uid = toUserObjectId(userId);
  const rows = await ViewedAt.find({ userId: uid })
    .sort({ viewedAt: -1 })
    .limit(MAX_VIEWED)
    .select("productId")
    .lean();
  return rows.map((r) => r.productId);
}

/** 20 tadan oshsa eng eski viewedAt bo‘yicha o‘chiriladi */
async function trimOldestBeyondLimit(userId) {
  const uid = toUserObjectId(userId);
  const total = await ViewedAt.countDocuments({ userId: uid });
  if (total <= MAX_VIEWED) return;

  const excess = await ViewedAt.find({ userId: uid })
    .sort({ viewedAt: 1 })
    .limit(total - MAX_VIEWED)
    .select("_id")
    .lean();

  if (excess.length > 0) {
    await ViewedAt.deleteMany({ _id: { $in: excess.map((r) => r._id) } });
  }
}

async function recordProductView(userId, rawProductId) {
  const productId = Number(rawProductId);
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }

  const product = await findNewestProductById(productId);
  // Katalog bilan bir xil: pending / pause / yashirin — tarixga yozilmasin
  if (!product || !isProductActiveOnClient(product)) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const uid = toUserObjectId(userId);
  const snapshot = {
    name: getProductDisplayName(product),
    price: getProductDisplayPrice(product),
    viewedAt: new Date(),
  };

  try {
    await ViewedAt.findOneAndUpdate(
      { userId: uid, productId },
      {
        $set: snapshot,
        $setOnInsert: { userId: uid, productId },
      },
      { upsert: true, new: true },
    );
  } catch (err) {
    if (err.code === 11000) {
      await ViewedAt.updateOne({ userId: uid, productId }, { $set: snapshot });
    } else {
      throw err;
    }
  }

  await trimOldestBeyondLimit(userId);
  return listViewsForUser(userId);
}

module.exports = {
  MAX_VIEWED,
  listViewsForUser,
  getRecentProductIds,
  recordProductView,
};
