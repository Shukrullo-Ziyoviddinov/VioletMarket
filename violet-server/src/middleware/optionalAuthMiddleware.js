const { verifyUserToken } = require("../utils/jwt");

/** Bearer token bo‘lsa req.userId qo‘yiladi, bo‘lmasa davom etadi */
function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      req.userId = verifyUserToken(token);
    } catch {
      /* token yaroqsiz — qidiruv ochiq qoladi */
    }
  }
  next();
}

module.exports = { optionalAuthMiddleware };
