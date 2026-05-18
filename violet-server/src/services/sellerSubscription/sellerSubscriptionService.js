const { SellerSubscription } = require("../../models/sellerSubscription");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { parseSellerId } = require("./sellerSubscriptionHelpers");

async function assertSellerExists(sellerId) {
  const seller = await SellerAccount.findOne({ id: sellerId }).lean();
  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }
  return seller;
}

async function syncSellerSubscriberCount(sellerId) {
  const subscriberCount = await SellerSubscription.countDocuments({ sellerId });
  await SellerAccount.updateOne({ id: sellerId }, { $set: { subscriberCount } });
  return subscriberCount;
}

async function getSellerStatus(sellerIdRaw, userId) {
  const sellerId = parseSellerId(sellerIdRaw);
  await assertSellerExists(sellerId);

  const subscriberCount = await syncSellerSubscriberCount(sellerId);

  let subscribed = false;
  if (userId) {
    const row = await SellerSubscription.findOne({ userId, sellerId }).lean();
    subscribed = Boolean(row);
  }

  return { sellerId, subscriberCount, subscribed };
}

async function getMySubscriptions(userId) {
  const items = await SellerSubscription.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const sellerIds = items.map((item) => item.sellerId);
  if (sellerIds.length === 0) {
    return { sellerIds: [], sellers: [] };
  }

  const sellers = await SellerAccount.find({ id: { $in: sellerIds } }).lean();
  const byId = new Map(sellers.map((s) => [s.id, s]));
  const orderedSellers = sellerIds.map((id) => byId.get(id)).filter(Boolean);

  return { sellerIds, sellers: orderedSellers };
}

async function toggleSubscription(userId, sellerIdRaw) {
  const sellerId = parseSellerId(sellerIdRaw);
  await assertSellerExists(sellerId);

  const existing = await SellerSubscription.findOne({ userId, sellerId });
  let subscribed;

  if (existing) {
    await SellerSubscription.deleteOne({ _id: existing._id });
    subscribed = false;
  } else {
    try {
      await SellerSubscription.create({ userId, sellerId });
      subscribed = true;
    } catch (err) {
      if (err.code === 11000) {
        subscribed = true;
      } else {
        throw err;
      }
    }
  }

  const subscriberCount = await syncSellerSubscriberCount(sellerId);
  const mine = await getMySubscriptions(userId);

  return {
    sellerId,
    subscribed,
    subscriberCount,
    ...mine,
  };
}

module.exports = {
  getSellerStatus,
  getMySubscriptions,
  toggleSubscription,
};
