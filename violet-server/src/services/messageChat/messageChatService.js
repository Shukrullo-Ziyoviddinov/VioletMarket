const mongoose = require("mongoose");
const { MessageChat } = require("../../models/messageChat");
const { SellerAccount } = require("../../models/sellerAccount");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");

const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=";

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

function normalizeSellerId(raw) {
  const sellerId = String(raw || "").trim();
  if (!sellerId) {
    throw new HttpError(400, "Sotuvchi ID talab qilinadi", "INVALID_SELLER_ID");
  }
  return sellerId;
}

function normalizeMessageType(raw) {
  const type = String(raw || "").trim();
  if (!["text", "image", "product"].includes(type)) {
    throw new HttpError(400, "Xabar turi noto'g'ri", "INVALID_MESSAGE_TYPE");
  }
  return type;
}

function validateContent(type, content) {
  if (type === "text") {
    const text = String(content || "").trim();
    if (!text) {
      throw new HttpError(400, "Xabar matni bo'sh bo'lmasligi kerak", "EMPTY_MESSAGE");
    }
    return text;
  }

  if (type === "image") {
    const url = String(content || "").trim();
    if (!url) {
      throw new HttpError(400, "Rasm URL talab qilinadi", "EMPTY_IMAGE");
    }
    return url;
  }

  if (type === "product") {
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      throw new HttpError(400, "Mahsulot ma'lumoti noto'g'ri", "INVALID_PRODUCT");
    }
    return content;
  }

  return content;
}

function mapMessageToClient(row) {
  return {
    id: String(row._id),
    sender: row.sender === "user" ? "customer" : "seller",
    type: row.type,
    content: row.content,
    createdAt: row.createdAt,
    readByUser: Boolean(row.readByUser),
    readBySeller: Boolean(row.readBySeller),
  };
}

function mapMessageToSocket(row) {
  return {
    id: String(row._id || row.id),
    sender: row.sender,
    type: row.type,
    content: row.content,
    createdAt: row.createdAt,
    readByUser: Boolean(row.readByUser),
    readBySeller: Boolean(row.readBySeller),
  };
}

async function assertSellerExists(sellerId) {
  const seller = await SellerAccount.findOne({ id: sellerId }).lean();
  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }
  return seller;
}

async function assertUserExists(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new HttpError(404, "Foydalanuvchi topilmadi", "USER_NOT_FOUND");
  }
  return user;
}

async function listUserThreads(userId) {
  const uid = toUserObjectId(userId);

  const rows = await MessageChat.aggregate([
    { $match: { userId: uid } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$sellerId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sender", "seller"] },
                  { $eq: ["$readByUser", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  if (rows.length === 0) {
    return { items: [], totalUnread: 0 };
  }

  const sellerIds = rows.map((row) => row._id);
  const sellers = await SellerAccount.find({ id: { $in: sellerIds } }).lean();
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  const items = rows.map((row) => {
    const seller = sellerMap.get(row._id) || null;
    const last = row.lastMessage;
    return {
      sellerId: row._id,
      sellerName: seller?.name || { uz: "Sotuvchi", ru: "Sotuvchi" },
      sellerLogo: seller?.logo || null,
      lastMessage: mapMessageToClient(last),
      unreadCount: row.unreadCount,
    };
  });

  const totalUnread = items.reduce((sum, item) => sum + item.unreadCount, 0);
  return { items, totalUnread };
}

async function listSellerThreads(sellerShopId) {
  const sellerId = normalizeSellerId(sellerShopId);

  const rows = await MessageChat.aggregate([
    { $match: { sellerId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sender", "user"] },
                  { $eq: ["$readBySeller", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  if (rows.length === 0) {
    return { items: [], totalUnread: 0 };
  }

  const userIds = rows.map((row) => row._id);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const items = rows.map((row) => {
    const user = userMap.get(String(row._id)) || null;
    const last = row.lastMessage;
    return {
      userId: String(row._id),
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      profileImage: user?.profileImage || DEFAULT_AVATAR,
      lastMessage: {
        id: String(last._id),
        sender: last.sender,
        type: last.type,
        content: last.content,
        createdAt: last.createdAt,
      },
      unreadCount: row.unreadCount,
    };
  });

  const totalUnread = items.reduce((sum, item) => sum + item.unreadCount, 0);
  return { items, totalUnread };
}

async function getThreadMessagesForUser(userId, sellerIdRaw) {
  const uid = toUserObjectId(userId);
  const sellerId = normalizeSellerId(sellerIdRaw);
  await assertSellerExists(sellerId);

  const rows = await MessageChat.find({ userId: uid, sellerId })
    .sort({ createdAt: 1 })
    .lean();

  return { items: rows.map(mapMessageToClient) };
}

async function getThreadMessagesForSeller(sellerShopId, userIdRaw) {
  const sellerId = normalizeSellerId(sellerShopId);
  const uid = toUserObjectId(userIdRaw);
  await assertUserExists(uid);

  const rows = await MessageChat.find({ userId: uid, sellerId })
    .sort({ createdAt: 1 })
    .lean();

  return {
    items: rows.map((row) => ({
      id: String(row._id),
      sender: row.sender,
      type: row.type,
      content: row.content,
      createdAt: row.createdAt,
      readByUser: Boolean(row.readByUser),
      readBySeller: Boolean(row.readBySeller),
    })),
  };
}

async function sendUserMessage(userId, sellerIdRaw, payload) {
  const uid = toUserObjectId(userId);
  const sellerId = normalizeSellerId(sellerIdRaw);
  await assertSellerExists(sellerId);

  const type = normalizeMessageType(payload?.type);
  const content = validateContent(type, payload?.content);

  const doc = await MessageChat.create({
    userId: uid,
    sellerId,
    sender: "user",
    type,
    content,
    readByUser: true,
    readBySeller: false,
  });

  return {
    message: mapMessageToClient(doc.toObject()),
    socketMessage: mapMessageToSocket(doc.toObject()),
  };
}

async function sendSellerMessage(sellerShopId, userIdRaw, payload) {
  const sellerId = normalizeSellerId(sellerShopId);
  const uid = toUserObjectId(userIdRaw);
  await assertUserExists(uid);
  await assertSellerExists(sellerId);

  const type = normalizeMessageType(payload?.type);
  const content = validateContent(type, payload?.content);

  const doc = await MessageChat.create({
    userId: uid,
    sellerId,
    sender: "seller",
    type,
    content,
    readByUser: false,
    readBySeller: true,
  });

  return {
    message: {
      id: String(doc._id),
      sender: "seller",
      type: doc.type,
      content: doc.content,
      createdAt: doc.createdAt,
      readByUser: false,
      readBySeller: true,
    },
    socketMessage: mapMessageToSocket(doc.toObject()),
  };
}

async function markThreadReadByUser(userId, sellerIdRaw) {
  const uid = toUserObjectId(userId);
  const sellerId = normalizeSellerId(sellerIdRaw);

  await MessageChat.updateMany(
    { userId: uid, sellerId, sender: "seller", readByUser: false },
    { $set: { readByUser: true } },
  );

  return { ok: true };
}

async function markThreadReadBySeller(sellerShopId, userIdRaw) {
  const sellerId = normalizeSellerId(sellerShopId);
  const uid = toUserObjectId(userIdRaw);

  await MessageChat.updateMany(
    { userId: uid, sellerId, sender: "user", readBySeller: false },
    { $set: { readBySeller: true } },
  );

  return { ok: true };
}

module.exports = {
  listUserThreads,
  listSellerThreads,
  getThreadMessagesForUser,
  getThreadMessagesForSeller,
  sendUserMessage,
  sendSellerMessage,
  markThreadReadByUser,
  markThreadReadBySeller,
};
