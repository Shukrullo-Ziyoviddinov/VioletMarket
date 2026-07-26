const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { HttpError } = require("./httpError");

function signLogisticaToken(profileId) {
  return jwt.sign(
    { sub: profileId.toString(), role: "logistica" },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn },
  );
}

function verifyLogisticaToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (payload?.role !== "logistica" || !payload?.sub) {
      throw new HttpError(401, "Logistica token yaroqsiz", "INVALID_TOKEN");
    }
    return String(payload.sub);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      401,
      "Logistica token yaroqsiz yoki muddati tugagan",
      "INVALID_TOKEN",
    );
  }
}

module.exports = { signLogisticaToken, verifyLogisticaToken };
