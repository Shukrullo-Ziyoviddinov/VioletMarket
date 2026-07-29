const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");

function authenticateMessageChatSocket(handshake) {
  const adminKey = String(handshake?.auth?.adminKey || "").trim();
  if (adminKey && adminKey === authConfig.adminSocketKey) {
    return { kind: "admin" };
  }

  const token = String(handshake?.auth?.token || "").trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);

    if (payload?.role === "seller" && payload?.sub) {
      return { kind: "seller", sellerId: String(payload.sub).trim() };
    }

    if (payload?.role === "delivery" && payload?.sub) {
      return { kind: "courier", deliveryId: String(payload.sub).trim() };
    }

    if (payload?.role === "logistica" && payload?.sub) {
      return { kind: "logistica", logisticaId: String(payload.sub).trim() };
    }

    if (payload?.purpose === "seller-registration") {
      return null;
    }

    if (payload?.sub) {
      return { kind: "user", userId: String(payload.sub).trim() };
    }
  } catch {
    return null;
  }

  return null;
}

module.exports = { authenticateMessageChatSocket };
