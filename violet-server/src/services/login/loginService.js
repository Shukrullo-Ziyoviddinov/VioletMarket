const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { normalizeEmail, isValidEmail } = require("../../utils/email");
const { signUserToken } = require("../../utils/jwt");
const { createAndSendOtp, verifyOtp } = require("./otpService");

function assertValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new HttpError(400, "Email formati noto'g'ri", "INVALID_EMAIL");
  }
  return normalized;
}

async function sendLoginCode(email) {
  const normalized = assertValidEmail(email);
  const user = await User.findOne({ email: normalized });
  if (!user) {
    throw new HttpError(404, "Bu email bilan foydalanuvchi topilmadi. Ro'yxatdan o'ting.", "USER_NOT_FOUND");
  }
  const meta = await createAndSendOtp(normalized, "login");
  return { email: normalized, ...meta };
}

async function sendRegisterCode(email) {
  const normalized = assertValidEmail(email);
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    throw new HttpError(409, "Bu email allaqachon ro'yxatdan o'tgan", "EMAIL_EXISTS");
  }
  const meta = await createAndSendOtp(normalized, "register");
  return { email: normalized, ...meta };
}

async function verifyLoginCode(email, code) {
  const normalized = assertValidEmail(email);
  await verifyOtp(normalized, "login", code);

  const user = await User.findOne({ email: normalized });
  if (!user) {
    throw new HttpError(404, "Foydalanuvchi topilmadi", "USER_NOT_FOUND");
  }

  const token = signUserToken(user._id);
  return { token, user: user.toPublicJSON() };
}

module.exports = {
  sendLoginCode,
  sendRegisterCode,
  verifyLoginCode,
};
