const mongoose = require("mongoose");
const { SupportChatMessage } = require("../../models/supportChatMessage");
const { DeliveryAccount } = require("../../models/deliveryAccount");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  saveSupportChatImage,
  deleteManagedSupportChatImage,
} = require("./supportChatImageStorage");

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
    deliveryId: doc.deliveryId.toString(),
    sender: doc.sender,
    type,
    content,
    readByCourier: Boolean(doc.readByCourier),
    readByAdmin: Boolean(doc.readByAdmin),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function assertObjectId(id, label = "ID") {
  const value = String(id || "").trim();
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new HttpError(400, `${label} noto‘g‘ri`, "VALIDATION_ERROR");
  }
  return value;
}

async function assertActiveCourier(deliveryId) {
  const account = await DeliveryAccount.findById(deliveryId);
  if (!account) {
    throw new HttpError(404, "Kuryer topilmadi", "COURIER_NOT_FOUND");
  }
  if (account.status !== "active") {
    throw new HttpError(403, "Kuryer faol emas", "COURIER_INACTIVE");
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
    const saved = saveSupportChatImage(imageBase64);
    return {
      type: "image",
      content: saved.publicPath,
    };
  }

  throw new HttpError(400, "Xabar turi noto‘g‘ri", "VALIDATION_ERROR");
}

async function listMessagesForCourier(deliveryId) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);

  const messages = await SupportChatMessage.find({ deliveryId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listMessagesForAdmin(deliveryId) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);

  const messages = await SupportChatMessage.find({ deliveryId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listAdminThreads() {
  const rows = await SupportChatMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$deliveryId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sender", "courier"] },
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

  const deliveryIds = rows.map((row) => row._id);
  const accounts = await DeliveryAccount.find({ _id: { $in: deliveryIds } });
  const accountMap = new Map(
    accounts.map((account) => [account._id.toString(), account]),
  );

  const threads = rows
    .map((row) => {
      const account = accountMap.get(row._id.toString());
      if (!account || account.status !== "active") return null;

      return {
        deliveryId: account._id.toString(),
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: account.phone,
        profileImage: resolvePublicAssetUrl(account.profileImage || "") || "",
        unreadCount: row.unreadCount || 0,
        lastMessage: toMessageJSON(row.lastMessage),
      };
    })
    .filter(Boolean);

  return { threads };
}

async function sendCourierMessage(deliveryId, body) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);
  const payload = await buildMessagePayload(body);

  const doc = await SupportChatMessage.create({
    deliveryId: id,
    sender: "courier",
    type: payload.type,
    content: payload.content,
    readByCourier: true,
    readByAdmin: false,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message };
}

async function sendAdminMessage(deliveryId, body) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);
  const payload = await buildMessagePayload(body);

  const doc = await SupportChatMessage.create({
    deliveryId: id,
    sender: "admin",
    type: payload.type,
    content: payload.content,
    readByCourier: false,
    readByAdmin: true,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message };
}

async function getUnreadCountForCourier(deliveryId) {
  const id = assertObjectId(deliveryId, "Kuryer");
  const unread = await SupportChatMessage.countDocuments({
    deliveryId: id,
    sender: "admin",
    readByCourier: false,
  });
  return { unread };
}

async function markReadByCourier(deliveryId) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);

  const result = await SupportChatMessage.updateMany(
    {
      deliveryId: id,
      sender: "admin",
      readByCourier: false,
    },
    { $set: { readByCourier: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function markReadByAdmin(deliveryId) {
  const id = assertObjectId(deliveryId, "Kuryer");
  await assertActiveCourier(id);

  const result = await SupportChatMessage.updateMany(
    {
      deliveryId: id,
      sender: "courier",
      readByAdmin: false,
    },
    { $set: { readByAdmin: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function deleteMessagesForCourier(deliveryId) {
  const id = String(deliveryId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return { deleted: 0 };

  const messages = await SupportChatMessage.find({ deliveryId: id });
  for (const message of messages) {
    if (message.type === "image") {
      const raw =
        typeof message.content === "string"
          ? message.content
          : String(message.content?.url || message.content?.path || "");
      deleteManagedSupportChatImage(raw);
    }
  }

  const result = await SupportChatMessage.deleteMany({ deliveryId: id });
  return { deleted: result.deletedCount || 0 };
}

module.exports = {
  listMessagesForCourier,
  listMessagesForAdmin,
  listAdminThreads,
  getUnreadCountForCourier,
  sendCourierMessage,
  sendAdminMessage,
  markReadByCourier,
  markReadByAdmin,
  deleteMessagesForCourier,
  toMessageJSON,
};
