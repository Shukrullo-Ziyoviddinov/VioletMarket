const { verifyUserToken } = require("../utils/jwt");
const { verifySellerToken } = require("../utils/sellerJwt");

function authenticateMessageChatSocket(handshake) {
  const token = String(handshake?.auth?.token || "").trim();
  if (!token) return null;

  try {
    const userId = verifyUserToken(token);
    return { kind: "user", userId: String(userId) };
  } catch {
    // user token emas — seller token tekshiriladi
  }

  try {
    const sellerId = verifySellerToken(token);
    return { kind: "seller", sellerId: String(sellerId) };
  } catch {
    return null;
  }
}

module.exports = { authenticateMessageChatSocket };
