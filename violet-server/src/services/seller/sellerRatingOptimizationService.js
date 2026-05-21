const { Product } = require("../../models/product");
const { Comment } = require("../../models/comment");
const { SellerRatingSummary } = require("../../models/sellerRatingSummary");

function toFixedPercent(value) {
  return Number(value.toFixed(1));
}

function buildDistributionFromCounts(counts, totalReviews) {
  return [5, 4, 3, 2, 1].map((star) => {
    const count = Number(counts.get(star) || 0);
    const percent = totalReviews > 0 ? toFixedPercent((count / totalReviews) * 100) : 0;
    return { star, count, percent };
  });
}

function mapSummaryDocToResponse(sellerId, row) {
  const totalReviews = Number(row?.totalReviews || 0);
  const ratingSum = Number(row?.ratingSum || 0);
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;
  const countMap = new Map([
    [1, Number(row?.star1 || 0)],
    [2, Number(row?.star2 || 0)],
    [3, Number(row?.star3 || 0)],
    [4, Number(row?.star4 || 0)],
    [5, Number(row?.star5 || 0)],
  ]);

  return {
    sellerId,
    averageRating,
    totalReviews,
    distribution: buildDistributionFromCounts(countMap, totalReviews),
  };
}

async function getSellerProductsMeta(sellerId) {
  const products = await Product.find({ sellerId }).lean();
  const productMap = new Map();
  for (const product of products) {
    productMap.set(Number(product.id), {
      id: Number(product.id),
      title: product.title ?? "",
      price: product.price ?? "",
      image: product.image || product.colors?.[0]?.mainImage || "/img/no-image.png",
    });
  }
  const productIds = Array.from(productMap.keys());
  return { productMap, productIds };
}

async function getSellerCommentsWithProductMeta(productMap, productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const rows = await Comment.find({
    productId: { $in: productIds },
    rating: { $gte: 1, $lte: 5 },
  })
    .sort({ createdAt: -1 })
    .lean();

  return rows
    .map((row) => {
      const product = productMap.get(Number(row.productId));
      if (!product) return null;
      return {
        id: String(row._id),
        productId: Number(row.productId),
        userName: row.userName || "",
        rating: Number(row.rating) || 0,
        text: row.text || "",
        image: row.image || null,
        createdAt: row.createdAt,
        product,
      };
    })
    .filter(Boolean);
}

async function recomputeSellerRatingSummary(sellerId) {
  const { productMap, productIds } = await getSellerProductsMeta(sellerId);
  if (!Array.isArray(productIds) || productIds.length === 0) {
    const zero = {
      sellerId,
      totalReviews: 0,
      ratingSum: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0,
    };
    await SellerRatingSummary.updateOne({ sellerId }, { $set: zero }, { upsert: true });
    return { ...mapSummaryDocToResponse(sellerId, zero), comments: [] };
  }

  const grouped = await Comment.aggregate([
    {
      $match: {
        productId: { $in: productIds },
        rating: { $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(grouped.map((row) => [Number(row._id), Number(row.count) || 0]));
  const totalReviews = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  const ratingSum = [1, 2, 3, 4, 5].reduce((sum, star) => sum + star * (counts.get(star) || 0), 0);

  const summaryUpdate = {
    sellerId,
    totalReviews,
    ratingSum,
    star1: counts.get(1) || 0,
    star2: counts.get(2) || 0,
    star3: counts.get(3) || 0,
    star4: counts.get(4) || 0,
    star5: counts.get(5) || 0,
  };

  await SellerRatingSummary.updateOne({ sellerId }, { $set: summaryUpdate }, { upsert: true });
  const comments = await getSellerCommentsWithProductMeta(productMap, productIds);
  return { ...mapSummaryDocToResponse(sellerId, summaryUpdate), comments };
}

async function getSellerRatingSummaryCached(sellerId) {
  const { productMap, productIds } = await getSellerProductsMeta(sellerId);
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {
      ...mapSummaryDocToResponse(sellerId, {
        totalReviews: 0,
        ratingSum: 0,
        star1: 0,
        star2: 0,
        star3: 0,
        star4: 0,
        star5: 0,
      }),
      comments: [],
    };
  }

  const row = await SellerRatingSummary.findOne({ sellerId }).lean();
  if (!row) {
    return recomputeSellerRatingSummary(sellerId);
  }
  const comments = await getSellerCommentsWithProductMeta(productMap, productIds);
  return { ...mapSummaryDocToResponse(sellerId, row), comments };
}

async function applyNewSellerRating({ sellerId, rating }) {
  const star = Number(rating);
  if (!sellerId || !Number.isFinite(star) || star < 1 || star > 5) return;
  const inc = {
    totalReviews: 1,
    ratingSum: star,
    [`star${star}`]: 1,
  };
  await SellerRatingSummary.updateOne(
    { sellerId },
    { $setOnInsert: { sellerId }, $inc: inc },
    { upsert: true },
  );
}

module.exports = {
  getSellerRatingSummaryCached,
  recomputeSellerRatingSummary,
  applyNewSellerRating,
};
