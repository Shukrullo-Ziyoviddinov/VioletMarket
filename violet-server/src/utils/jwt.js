const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { HttpError } = require("./httpError");

function signUserToken(userId) {
  return jwt.sign({ sub: userId.toString() }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

function verifyUserToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    return payload.sub;
  } catch {
    throw new HttpError(401, "Token yaroqsiz yoki muddati tugagan", "INVALID_TOKEN");
  }
}

module.exports = { signUserToken, verifyUserToken };
