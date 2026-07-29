const { Server } = require("socket.io");
const { authenticateMessageChatSocket } = require("./messageChatSocketAuth");
const { setMessageChatSocketIo } = require("./messageChatSocketEmitter");
const { registerMessageChatTypingOnSocket } = require("./messageChatTypingHandler");
const { registerMessageChatSendingOnSocket } = require("./messageChatSendingHandler");
const { registerMessageChatPresenceOnSocket } = require("./messageChatPresenceHandler");
const {
  getCourierRoom,
  getAdminRoom,
} = require("./supportChatSocketEmitter");
const {
  getLogisticaRoom,
  getLogisticaAdminRoom,
} = require("./logisticaChatSocketEmitter");

function initMessageChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const identity = authenticateMessageChatSocket(socket.handshake);
    if (!identity) {
      return next(new Error("UNAUTHORIZED"));
    }
    socket.data.messageChatIdentity = identity;
    return next();
  });

  io.on("connection", (socket) => {
    const identity = socket.data.messageChatIdentity;
    if (!identity) {
      socket.disconnect(true);
      return;
    }

    if (identity.kind === "user") {
      socket.join(`message-chat:user:${String(identity.userId).trim()}`);
      registerMessageChatTypingOnSocket(socket, io);
      registerMessageChatSendingOnSocket(socket, io);
      registerMessageChatPresenceOnSocket(socket, io);
    } else if (identity.kind === "seller") {
      socket.join(`message-chat:seller:${String(identity.sellerId).trim()}`);
      registerMessageChatTypingOnSocket(socket, io);
      registerMessageChatSendingOnSocket(socket, io);
      registerMessageChatPresenceOnSocket(socket, io);
    } else if (identity.kind === "courier") {
      socket.join(getCourierRoom(identity.deliveryId));
    } else if (identity.kind === "logistica") {
      socket.join(getLogisticaRoom(identity.logisticaId));
    } else if (identity.kind === "admin") {
      socket.join(getAdminRoom());
      socket.join(getLogisticaAdminRoom());
    }
  });

  setMessageChatSocketIo(io);
  return io;
}

module.exports = { initMessageChatSocket };
