const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { HttpError } = require("./httpError");

function signDeliveryToken(deliveryId) {
  return jwt.sign(
    { sub: deliveryId.toString(), role: "delivery" },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn },
  );
}

function verifyDeliveryToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (payload?.role !== "delivery" || !payload?.sub) {
      throw new HttpError(401, "Delivery token yaroqsiz", "INVALID_TOKEN");
    }
    return String(payload.sub);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      401,
      "Delivery token yaroqsiz yoki muddati tugagan",
      "INVALID_TOKEN",
    );
  }
}

module.exports = { signDeliveryToken, verifyDeliveryToken };
