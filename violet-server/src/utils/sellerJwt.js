const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { HttpError } = require("./httpError");

function signSellerRegistrationToken(email) {
  return jwt.sign({ email, purpose: "seller-registration" }, authConfig.jwtSecret, {
    expiresIn: "7d",
  });
}

function verifySellerRegistrationToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (payload?.purpose !== "seller-registration" || !payload?.email) {
      throw new HttpError(401, "Ro'yxat tokeni yaroqsiz", "INVALID_REGISTRATION_TOKEN");
    }
    return String(payload.email).toLowerCase();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Ro'yxat tokeni yaroqsiz yoki muddati tugagan", "INVALID_REGISTRATION_TOKEN");
  }
}

function signSellerToken(shopId) {
  return jwt.sign({ sub: shopId, role: "seller" }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

function verifySellerToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (payload?.role !== "seller" || !payload?.sub) {
      throw new HttpError(401, "Token yaroqsiz", "INVALID_TOKEN");
    }
    return String(payload.sub);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Token yaroqsiz yoki muddati tugagan", "INVALID_TOKEN");
  }
}

module.exports = {
  signSellerRegistrationToken,
  verifySellerRegistrationToken,
  signSellerToken,
  verifySellerToken,
};
