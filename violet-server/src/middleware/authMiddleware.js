const { verifyUserToken } = require("../utils/jwt");
const { HttpError } = require("../utils/httpError");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Avtorizatsiya talab qilinadi", "UNAUTHORIZED"));
  }
  try {
    req.userId = verifyUserToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authMiddleware };
