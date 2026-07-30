const {
  SellerSupportChatMessage,
} = require("../../models/sellerSupportChatMessage");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  saveSellerSupportChatImage,
  deleteManagedSellerSupportChatImage,
} = require("./sellerSupportChatImageStorage");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function resolveSellerDisplayName(account, sellerId) {
  return String(account?.name?.uz || account?.name?.ru || sellerId || "").trim();
}

function toMessageJSON(doc) {
  if (!doc) return null;
  const type = doc.type;
  let content = doc.content;

  if (type === "image") {
    const raw =
      typeof content === "string"
        ? content
        : String(content?.url || content?.path || "");
    content = resolvePublicAssetUrl(raw) || raw;
  } else {
    content = String(content || "");
  }

  return {
    id: doc._id.toString(),
    sellerId: String(doc.sellerId || ""),
    sender: doc.sender,
    type,
    content,
    readBySeller: Boolean(doc.readBySeller),
    readByAdmin: Boolean(doc.readByAdmin),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function assertSellerAccount(sellerId) {
  const id = cleanSellerId(sellerId);
  if (!id) {
    throw new HttpError(400, "Seller ID noto‘g‘ri", "VALIDATION_ERROR");
  }
  const account = await SellerAccount.findOne({ id });
  if (!account) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }
  return account;
}

function normalizeTextContent(content) {
  const text = String(content || "").trim();
  if (!text) {
    throw new HttpError(400, "Xabar matni bo‘sh bo‘lmasligi kerak", "EMPTY_MESSAGE");
  }
  if (text.length > 4000) {
    throw new HttpError(400, "Xabar juda uzun", "VALIDATION_ERROR");
  }
  return text;
}

async function buildMessagePayload(body) {
  const type = String(body?.type || "text").trim();

  if (type === "text") {
    return {
      type: "text",
      content: normalizeTextContent(body?.content),
    };
  }

  if (type === "image") {
    const imageBase64 = body?.imageBase64 || body?.content;
    const saved = saveSellerSupportChatImage(imageBase64);
    return {
      type: "image",
      content: saved.publicPath,
    };
  }

  throw new HttpError(400, "Xabar turi noto‘g‘ri", "VALIDATION_ERROR");
}

function toThreadSeller(account) {
  return {
    sellerId: String(account.id || ""),
    name: resolveSellerDisplayName(account, account.id),
    logoUrl: resolvePublicAssetUrl(account.logo || "") || "",
    sellerCountry: String(account.sellerCountry || ""),
  };
}

async function listMessagesForSeller(sellerId) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);

  const messages = await SellerSupportChatMessage.find({ sellerId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listMessagesForAdmin(sellerId) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);

  const messages = await SellerSupportChatMessage.find({ sellerId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listAdminThreads() {
  const rows = await SellerSupportChatMessage.aggregate([
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
                  { $eq: ["$readByAdmin", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
        messageCount: { $sum: 1 },
      },
    },
    { $match: { messageCount: { $gt: 0 } } },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  const sellerIds = rows.map((row) => String(row._id || "")).filter(Boolean);
  const accounts = await SellerAccount.find({ id: { $in: sellerIds } });
  const accountMap = new Map(accounts.map((account) => [String(account.id), account]));

  const threads = rows
    .map((row) => {
      const account = accountMap.get(String(row._id || ""));
      if (!account) return null;
      return {
        ...toThreadSeller(account),
        unreadCount: row.unreadCount || 0,
        lastMessage: toMessageJSON(row.lastMessage),
      };
    })
    .filter(Boolean);

  return { threads };
}

async function sendSellerMessage(sellerId, body) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);
  const payload = await buildMessagePayload(body);

  const doc = await SellerSupportChatMessage.create({
    sellerId: id,
    sender: "seller",
    type: payload.type,
    content: payload.content,
    readBySeller: true,
    readByAdmin: false,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message, account };
}

async function sendAdminMessage(sellerId, body) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);
  const payload = await buildMessagePayload(body);

  const doc = await SellerSupportChatMessage.create({
    sellerId: id,
    sender: "admin",
    type: payload.type,
    content: payload.content,
    readBySeller: false,
    readByAdmin: true,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message, account };
}

async function getUnreadCountForSeller(sellerId) {
  const id = cleanSellerId(sellerId);
  if (!id) return { unread: 0 };
  const unread = await SellerSupportChatMessage.countDocuments({
    sellerId: id,
    sender: "admin",
    readBySeller: false,
  });
  return { unread };
}

async function getUnreadCountForAdmin() {
  const unread = await SellerSupportChatMessage.countDocuments({
    sender: "seller",
    readByAdmin: false,
  });
  return { unread };
}

async function markReadBySeller(sellerId) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);

  const result = await SellerSupportChatMessage.updateMany(
    {
      sellerId: id,
      sender: "admin",
      readBySeller: false,
    },
    { $set: { readBySeller: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function markReadByAdmin(sellerId) {
  const account = await assertSellerAccount(sellerId);
  const id = String(account.id);

  const result = await SellerSupportChatMessage.updateMany(
    {
      sellerId: id,
      sender: "seller",
      readByAdmin: false,
    },
    { $set: { readByAdmin: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function deleteMessagesForSeller(sellerId) {
  const id = cleanSellerId(sellerId);
  if (!id) return { deleted: 0 };

  const messages = await SellerSupportChatMessage.find({ sellerId: id });
  for (const message of messages) {
    if (message.type === "image") {
      const raw =
        typeof message.content === "string"
          ? message.content
          : String(message.content?.url || message.content?.path || "");
      deleteManagedSellerSupportChatImage(raw);
    }
  }

  const result = await SellerSupportChatMessage.deleteMany({ sellerId: id });
  return { deleted: result.deletedCount || 0 };
}

module.exports = {
  listMessagesForSeller,
  listMessagesForAdmin,
  listAdminThreads,
  getUnreadCountForSeller,
  getUnreadCountForAdmin,
  sendSellerMessage,
  sendAdminMessage,
  markReadBySeller,
  markReadByAdmin,
  deleteMessagesForSeller,
  toMessageJSON,
  resolveSellerDisplayName,
};
