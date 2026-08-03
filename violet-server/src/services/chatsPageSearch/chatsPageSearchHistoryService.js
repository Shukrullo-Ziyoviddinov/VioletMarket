const mongoose = require("mongoose");
const { ChatsSearchHistoriya } = require("../../models/chatsSearchHistoriya");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const {
  enrichSellersByIds,
  mapSellerSearchResultForClient,
} = require("../../chatsPageSearch/chatsPageSearchAlgorithm");

const MAX_HISTORY_ITEMS = 20;

function toUserObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

async function trimHistory(userId, max = MAX_HISTORY_ITEMS) {
  const uid = toUserObjectId(userId);
  const rows = await ChatsSearchHistoriya.find({ userId: uid })
    .sort({ updatedAt: -1 })
    .skip(max)
    .select("_id")
    .lean();

  if (!rows.length) return;

  await ChatsSearchHistoriya.deleteMany({
    _id: { $in: rows.map((row) => row._id) },
  });
}

async function getSearchHistory(userId) {
  const uid = toUserObjectId(userId);
  const rows = await ChatsSearchHistoriya.find({ userId: uid })
    .sort({ updatedAt: -1 })
    .limit(MAX_HISTORY_ITEMS)
    .lean();

  const sellerIds = rows.map((row) => String(row.sellerId || "")).filter(Boolean);
  const enriched = await enrichSellersByIds(sellerIds);

  return {
    items: enriched.map(mapSellerSearchResultForClient),
  };
}

async function addSellerToHistory(userId, rawSellerId) {
  const sellerId = String(rawSellerId || "").trim();
  if (!sellerId) {
    throw new HttpError(400, "Sotuvchi id bo'sh", "EMPTY_SELLER_ID");
  }

  const seller = await SellerAccount.findOne({
    id: sellerId,
    status: { $ne: "paused" },
  })
    .select({ id: 1 })
    .lean();

  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  const uid = toUserObjectId(userId);
  await ChatsSearchHistoriya.deleteOne({ userId: uid, sellerId });
  await ChatsSearchHistoriya.create({ userId: uid, sellerId });
  await trimHistory(userId);

  return getSearchHistory(userId);
}

async function removeSellerFromHistory(userId, rawSellerId) {
  const sellerId = String(rawSellerId || "").trim();
  const uid = toUserObjectId(userId);

  if (sellerId) {
    await ChatsSearchHistoriya.deleteOne({ userId: uid, sellerId });
  }

  return getSearchHistory(userId);
}

module.exports = {
  getSearchHistory,
  addSellerToHistory,
  removeSellerFromHistory,
};
