const { verifyLogisticaToken } = require("../utils/logisticaJwt");
const { HttpError } = require("../utils/httpError");

function logisticaAuthMiddleware(req, _res, next) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) {
    return next(
      new HttpError(401, "Avtorizatsiya talab qilinadi", "UNAUTHORIZED"),
    );
  }

  try {
    req.logisticaId = verifyLogisticaToken(header.slice(7).trim());
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { logisticaAuthMiddleware };
