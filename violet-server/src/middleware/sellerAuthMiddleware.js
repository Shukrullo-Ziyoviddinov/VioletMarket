const { verifySellerToken } = require("../utils/sellerJwt");
const { HttpError } = require("../utils/httpError");

function sellerAuthMiddleware(req, res, next) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Avtorizatsiya talab qilinadi", "UNAUTHORIZED"));
  }

  const token = header.slice(7).trim();
  try {
    req.sellerShopId = verifySellerToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { sellerAuthMiddleware };
