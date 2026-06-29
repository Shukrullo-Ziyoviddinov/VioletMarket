const { MESSAGE_CHAT_SOCKET_EVENTS } = require("./messageChatSocketEvents");
const {
  markUserOnline,
  markUserOffline,
  markSellerOnline,
  markSellerOffline,
  getUserPresencePayload,
  getSellerPresencePayload,
} = require("./messageChatPresenceStore");

function getPresenceWatchUserRoom(userId) {
  return `message-chat:presence-watch:user:${String(userId || "").trim()}`;
}

function getPresenceWatchSellerRoom(sellerId) {
  return `message-chat:presence-watch:seller:${String(sellerId || "").trim()}`;
}

function normalizeSocketId(value) {
  return String(value || "").trim();
}

function registerMessageChatPresenceOnSocket(socket, io) {
  const identity = socket.data.messageChatIdentity;
  if (!identity) return;

  if (identity.kind === "user") {
    const payload = markUserOnline(identity.userId);
    if (payload) {
      io.to(getPresenceWatchUserRoom(identity.userId)).emit(
        MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
        payload,
      );
    }
  } else if (identity.kind === "seller") {
    const payload = markSellerOnline(identity.sellerId);
    if (payload) {
      io.to(getPresenceWatchSellerRoom(identity.sellerId)).emit(
        MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
        payload,
      );
    }
  }

  socket.on(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_SUBSCRIBE, (payload) => {
    const watchKind = String(payload?.watchKind || "").trim();

    if (watchKind === "user") {
      const userId = normalizeSocketId(payload?.userId);
      if (!userId) return;

      socket.join(getPresenceWatchUserRoom(userId));
      const state = getUserPresencePayload(userId);
      if (state) {
        socket.emit(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE, state);
      }
      return;
    }

    if (watchKind === "seller") {
      const sellerId = normalizeSocketId(payload?.sellerId);
      if (!sellerId) return;

      socket.join(getPresenceWatchSellerRoom(sellerId));
      const state = getSellerPresencePayload(sellerId);
      if (state) {
        socket.emit(MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE, state);
      }
    }
  });

  socket.on("disconnect", () => {
    const currentIdentity = socket.data.messageChatIdentity;
    if (!currentIdentity) return;

    if (currentIdentity.kind === "user") {
      const payload = markUserOffline(currentIdentity.userId);
      if (payload) {
        io.to(getPresenceWatchUserRoom(currentIdentity.userId)).emit(
          MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
          payload,
        );
      }
      return;
    }

    if (currentIdentity.kind === "seller") {
      const payload = markSellerOffline(currentIdentity.sellerId);
      if (payload) {
        io.to(getPresenceWatchSellerRoom(currentIdentity.sellerId)).emit(
          MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
          payload,
        );
      }
    }
  });
}

module.exports = {
  registerMessageChatPresenceOnSocket,
  getPresenceWatchUserRoom,
  getPresenceWatchSellerRoom,
};
