const mongoose = require("mongoose");
const { LogisticaChatMessage } = require("../../models/logisticaChatMessage");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  saveLogisticaChatImage,
  deleteManagedLogisticaChatImage,
} = require("./logisticaChatImageStorage");

const COUNTRY_LABELS = {
  china: "Xitoy",
  usa: "AQSH",
  turkey: "Turkiya",
  korea: "Koreya",
  japan: "Yaponiya",
};

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
    logisticaId: doc.logisticaId.toString(),
    sender: doc.sender,
    type,
    content,
    readByLogistica: Boolean(doc.readByLogistica),
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

async function assertActiveLogistica(logisticaId) {
  const profile = await LogisticaProfile.findById(logisticaId);
  if (!profile) {
    throw new HttpError(404, "Logistica topilmadi", "LOGISTICA_NOT_FOUND");
  }
  if (profile.status !== "active") {
    throw new HttpError(403, "Logistica faol emas", "LOGISTICA_INACTIVE");
  }
  return profile;
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
    const saved = saveLogisticaChatImage(imageBase64);
    return {
      type: "image",
      content: saved.publicPath,
    };
  }

  throw new HttpError(400, "Xabar turi noto‘g‘ri", "VALIDATION_ERROR");
}

function toThreadProfile(profile) {
  const country = String(profile.logisticaCountry || "");
  return {
    logisticaId: profile._id.toString(),
    companyName: profile.companyName || "",
    email: profile.email || "",
    logisticaCountry: country,
    countryLabel: COUNTRY_LABELS[country] || country,
    chinaPhone: profile.chinaPhone || "",
  };
}

async function listMessagesForLogistica(logisticaId) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);

  const messages = await LogisticaChatMessage.find({ logisticaId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listMessagesForAdmin(logisticaId) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);

  const messages = await LogisticaChatMessage.find({ logisticaId: id }).sort({
    createdAt: 1,
  });

  return { messages: messages.map(toMessageJSON) };
}

async function listAdminThreads() {
  const rows = await LogisticaChatMessage.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$logisticaId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sender", "logistica"] },
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

  const logisticaIds = rows.map((row) => row._id);
  const profiles = await LogisticaProfile.find({ _id: { $in: logisticaIds } });
  const profileMap = new Map(
    profiles.map((profile) => [profile._id.toString(), profile]),
  );

  const threads = rows
    .map((row) => {
      const profile = profileMap.get(row._id.toString());
      if (!profile || profile.status !== "active") return null;

      return {
        ...toThreadProfile(profile),
        unreadCount: row.unreadCount || 0,
        lastMessage: toMessageJSON(row.lastMessage),
      };
    })
    .filter(Boolean);

  return { threads };
}

async function sendLogisticaMessage(logisticaId, body) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);
  const payload = await buildMessagePayload(body);

  const doc = await LogisticaChatMessage.create({
    logisticaId: id,
    sender: "logistica",
    type: payload.type,
    content: payload.content,
    readByLogistica: true,
    readByAdmin: false,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message };
}

async function sendAdminMessage(logisticaId, body) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);
  const payload = await buildMessagePayload(body);

  const doc = await LogisticaChatMessage.create({
    logisticaId: id,
    sender: "admin",
    type: payload.type,
    content: payload.content,
    readByLogistica: false,
    readByAdmin: true,
  });

  const message = toMessageJSON(doc);
  return { message, socketMessage: message };
}

async function getUnreadCountForLogistica(logisticaId) {
  const id = assertObjectId(logisticaId, "Logistica");
  const unread = await LogisticaChatMessage.countDocuments({
    logisticaId: id,
    sender: "admin",
    readByLogistica: false,
  });
  return { unread };
}

async function markReadByLogistica(logisticaId) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);

  const result = await LogisticaChatMessage.updateMany(
    {
      logisticaId: id,
      sender: "admin",
      readByLogistica: false,
    },
    { $set: { readByLogistica: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function markReadByAdmin(logisticaId) {
  const id = assertObjectId(logisticaId, "Logistica");
  await assertActiveLogistica(id);

  const result = await LogisticaChatMessage.updateMany(
    {
      logisticaId: id,
      sender: "logistica",
      readByAdmin: false,
    },
    { $set: { readByAdmin: true } },
  );

  return { updated: result.modifiedCount || 0 };
}

async function deleteMessagesForLogistica(logisticaId) {
  const id = String(logisticaId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return { deleted: 0 };

  const messages = await LogisticaChatMessage.find({ logisticaId: id });
  for (const message of messages) {
    if (message.type === "image") {
      const raw =
        typeof message.content === "string"
          ? message.content
          : String(message.content?.url || message.content?.path || "");
      deleteManagedLogisticaChatImage(raw);
    }
  }

  const result = await LogisticaChatMessage.deleteMany({ logisticaId: id });
  return { deleted: result.deletedCount || 0 };
}

module.exports = {
  listMessagesForLogistica,
  listMessagesForAdmin,
  listAdminThreads,
  getUnreadCountForLogistica,
  sendLogisticaMessage,
  sendAdminMessage,
  markReadByLogistica,
  markReadByAdmin,
  deleteMessagesForLogistica,
  toMessageJSON,
};
