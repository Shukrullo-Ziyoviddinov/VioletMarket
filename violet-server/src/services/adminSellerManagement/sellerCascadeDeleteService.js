const { Product } = require("../../models/product");
const { Comment } = require("../../models/comment");
const { PendingReview } = require("../../models/pendingReview");
const { CartItem } = require("../../models/cart");
const { Wishlist } = require("../../models/wishlist");
const { ViewedAt } = require("../../models/viewedAt");
const { ProductSectionMetric } = require("../../models/productSectionMetric");
const { SellerAccount } = require("../../models/sellerAccount");
const { SellerRegistration } = require("../../models/sellerRegistration");
const { SellerRatingSummary } = require("../../models/sellerRatingSummary");
const { SellerSubscription } = require("../../models/sellerSubscription");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { assertValidShopId } = require("../../utils/shopId");

function collectUniqueProductIds(productRows) {
  return [
    ...new Set(
      (Array.isArray(productRows) ? productRows : [])
        .map((row) => Number(row?.id))
        .filter((id) => Number.isFinite(id)),
    ),
  ];
}

async function deleteSellerProductData(shopId, productIds) {
  if (!productIds.length) {
    const productsResult = await Product.deleteMany({ sellerId: shopId });
    return {
      products: productsResult.deletedCount || 0,
      comments: 0,
      pendingReviews: 0,
      cartItems: 0,
      wishlistItems: 0,
      viewedAtItems: 0,
      productSectionMetrics: 0,
    };
  }

  const [
    commentsResult,
    pendingReviewsResult,
    cartItemsResult,
    wishlistItemsResult,
    viewedAtItemsResult,
    productSectionMetricsResult,
    productsResult,
  ] = await Promise.all([
    Comment.deleteMany({ productId: { $in: productIds } }),
    PendingReview.deleteMany({ productId: { $in: productIds } }),
    CartItem.deleteMany({ productId: { $in: productIds } }),
    Wishlist.deleteMany({ productId: { $in: productIds } }),
    ViewedAt.deleteMany({ productId: { $in: productIds } }),
    ProductSectionMetric.deleteMany({ productId: { $in: productIds } }),
    Product.deleteMany({ sellerId: shopId }),
  ]);

  return {
    products: productsResult.deletedCount || 0,
    comments: commentsResult.deletedCount || 0,
    pendingReviews: pendingReviewsResult.deletedCount || 0,
    cartItems: cartItemsResult.deletedCount || 0,
    wishlistItems: wishlistItemsResult.deletedCount || 0,
    viewedAtItems: viewedAtItemsResult.deletedCount || 0,
    productSectionMetrics: productSectionMetricsResult.deletedCount || 0,
  };
}

async function deleteSellerCompletely(shopIdRaw) {
  const shopId = assertValidShopId(shopIdRaw);

  const registration = await SellerRegistration.findOne({
    shopId,
    status: "approved",
  });
  if (!registration) {
    throw new HttpError(404, "Tasdiqlangan sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  const productRows = await Product.find({ sellerId: shopId }).select({ id: 1 }).lean();
  const productIds = collectUniqueProductIds(productRows);

  const productDataDeleted = await deleteSellerProductData(shopId, productIds);

  const [
    subscriptionsResult,
    ratingsResult,
    registrationsResult,
    accountsResult,
    usersResult,
  ] = await Promise.all([
    SellerSubscription.deleteMany({ sellerId: shopId }),
    SellerRatingSummary.deleteMany({ sellerId: shopId }),
    SellerRegistration.deleteMany({ shopId }),
    SellerAccount.deleteMany({ id: shopId }),
    User.updateMany({ sellerAccountId: shopId }, { $set: { sellerAccountId: null } }),
  ]);

  return {
    shopId,
    shopDisplayName: registration.shopDisplayName || shopId,
    deleted: {
      ...productDataDeleted,
      sellerSubscriptions: subscriptionsResult.deletedCount || 0,
      sellerRatingSummaries: ratingsResult.deletedCount || 0,
      sellerRegistrations: registrationsResult.deletedCount || 0,
      sellerAccounts: accountsResult.deletedCount || 0,
      usersUnlinked: usersResult.modifiedCount || 0,
    },
  };
}

module.exports = {
  deleteSellerCompletely,
};
