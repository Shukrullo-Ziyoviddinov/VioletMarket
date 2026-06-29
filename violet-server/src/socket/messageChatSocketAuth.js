const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");

function authenticateMessageChatSocket(handshake) {
  const token = String(handshake?.auth?.token || "").trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);

    // Seller token ham `sub` ga ega — avval rolni tekshirish shart
    if (payload?.role === "seller" && payload?.sub) {
      return { kind: "seller", sellerId: String(payload.sub).trim() };
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
