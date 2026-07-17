const { verifyDeliveryToken } = require("../utils/deliveryJwt");
const { HttpError } = require("../utils/httpError");

function deliveryAuthMiddleware(req, _res, next) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) {
    return next(
      new HttpError(401, "Avtorizatsiya talab qilinadi", "UNAUTHORIZED"),
    );
  }

  try {
    req.deliveryId = verifyDeliveryToken(header.slice(7).trim());
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { deliveryAuthMiddleware };
