const { Comment } = require("../../models/comment");
const { Product } = require("../../models/product");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { applyNewSellerRating } = require("../seller/sellerRatingOptimizationService");
const { PendingReview } = require("../../models/pendingReview");
const { completePendingReview } = require("../pendingReview/pendingReviewService");

const MAX_IMAGE_LENGTH = 2_000_000;

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

function normalizeRating(raw) {
  const rating = Math.floor(Number(raw));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "Reyting 1 dan 5 gacha bo'lishi kerak", "INVALID_RATING");
  }
  return rating;
}

function mapCommentToClient(doc) {
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    userId: String(row.userId),
    productId: String(row.productId),
    userName: row.userName,
    rating: row.rating,
    text: row.text,
    image: row.image || null,
    isTest: Boolean(row.isTest),
    createdAt: row.createdAt,
  };
}

async function getCommentsByProductId(productIdRaw) {
  const productId = parseProductId(productIdRaw);
  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const rows = await Comment.find({ productId }).sort({ createdAt: -1 }).lean();
  return { comments: rows.map(mapCommentToClient) };
}

async function createComment(userId, payload) {
  const productId = parseProductId(payload.productId ?? payload.id);
  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(401, "Foydalanuvchi topilmadi", "UNAUTHORIZED");
  }

  const text = String(payload.text || "").trim();
  if (!text) {
    throw new HttpError(400, "Izoh matni majburiy", "TEXT_REQUIRED");
  }

  const profileName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (!profileName) {
    throw new HttpError(400, "Profilda ism va familiya to'ldirilishi kerak", "PROFILE_NAME_REQUIRED");
  }
  const userName = profileName;

  let image = payload.image ? String(payload.image) : null;
  if (image && image.length > MAX_IMAGE_LENGTH) {
    throw new HttpError(400, "Rasm hajmi juda katta", "IMAGE_TOO_LARGE");
  }
  if (image === "") image = null;

  const doc = await Comment.create({
    userId,
    productId,
    userName,
    rating: normalizeRating(payload.rating),
    text,
    image,
    isTest: payload.isTest === true,
  });

  if (product?.sellerId) {
    await applyNewSellerRating({
      sellerId: String(product.sellerId),
      rating: doc.rating,
    });
  }

  if (payload.pendingReviewId) {
    await completePendingReview(userId, payload.pendingReviewId);
  } else {
    await PendingReview.updateMany(
      { userId, productId, status: "pending" },
      { $set: { status: "completed" } },
    );
  }

  return { comment: mapCommentToClient(doc) };
}

module.exports = {
  getCommentsByProductId,
  createComment,
};
