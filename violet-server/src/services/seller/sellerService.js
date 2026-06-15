const { Product } = require("../../models/product");
const { SellerAccount } = require("../../models/sellerAccount");
const { SellerSubscription } = require("../../models/sellerSubscription");
const { HttpError } = require("../../utils/httpError");
const { getProductDisplayPrice } = require("../viewedAt/viewedAtHelpers");
const { getSellerRatingSummary } = require("./sellerRatingService");
const { CLIENT_ACTIVE_FILTER } = require("../../utils/productClientVisibility");
const {
  parseSellerId,
  parsePagination,
  parseSort,
  stripMongoMeta,
} = require("./sellerHelpers");

async function assertSellerExists(sellerId) {
  const seller = await SellerAccount.findOne({ id: sellerId }).lean();
  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }
  return seller;
}

async function getSubscriberCount(sellerId) {
  const subscriberCount = await SellerSubscription.countDocuments({ sellerId });
  await SellerAccount.updateOne({ id: sellerId }, { $set: { subscriberCount } });
  return subscriberCount;
}

function sortSellerProducts(products, sort) {
  const list = [...products];
  if (sort === "price-asc") {
    list.sort((a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b));
  } else if (sort === "price-desc") {
    list.sort((a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a));
  } else {
    list.sort((a, b) => Number(b.id) - Number(a.id));
  }
  return list;
}

async function getSellerProfile(sellerIdRaw, userId) {
  const sellerId = parseSellerId(sellerIdRaw);
  const sellerDoc = await assertSellerExists(sellerId);

  const [productCount, subscriberCount] = await Promise.all([
    Product.countDocuments({ sellerId, ...CLIENT_ACTIVE_FILTER }),
    getSubscriberCount(sellerId),
  ]);

  let subscribed = false;
  if (userId) {
    const row = await SellerSubscription.findOne({ userId, sellerId }).lean();
    subscribed = Boolean(row);
  }

  const seller = {
    ...stripMongoMeta(sellerDoc),
    subscriberCount,
  };

  return {
    seller,
    productCount,
    subscriberCount,
    subscribed,
  };
}

async function getSellerProducts(sellerIdRaw, query) {
  const sellerId = parseSellerId(sellerIdRaw);
  await assertSellerExists(sellerId);

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query?.sort);

  const allForSeller = await Product.find({ sellerId, ...CLIENT_ACTIVE_FILTER }).lean();
  const total = allForSeller.length;
  const sorted = sortSellerProducts(allForSeller, sort);
  const slice = sorted.slice(skip, skip + limit).map(stripMongoMeta);

  return {
    sellerId,
    products: slice,
    page,
    limit,
    total,
    hasMore: skip + slice.length < total,
    sort,
  };
}

module.exports = {
  getSellerProfile,
  getSellerProducts,
  getSellerRatingSummary,
};
