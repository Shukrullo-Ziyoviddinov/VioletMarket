const authConfig = require("../../config/auth");
const { HttpError } = require("../../utils/httpError");
const { generateOtpCode, hashOtpCode, verifyOtpCode } = require("../../utils/otp");
const { sendOtpEmail } = require("./brevoMailService");

const MAX_ATTEMPTS = 5;

/** Vaqtinchalik OTP (1 daqiqa) — faqat xotirada, MongoDB ga yozilmaydi */
const otpStore = new Map();

function otpKey(email, purpose) {
  return `${email}:${purpose}`;
}

function purgeExpired() {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt <= now) otpStore.delete(key);
  }
}

async function createAndSendOtp(email, purpose) {
  purgeExpired();

  const code = generateOtpCode();
  const expiresAt = Date.now() + authConfig.otpExpiryMs;

  otpStore.set(otpKey(email, purpose), {
    codeHash: hashOtpCode(code),
    expiresAt,
    attempts: 0,
  });

  await sendOtpEmail(email, code);

  return { expiresInSeconds: Math.floor(authConfig.otpExpiryMs / 1000), emailSent: true };
}

async function verifyOtp(email, purpose, code) {
  purgeExpired();

  const key = otpKey(email, purpose);
  const record = otpStore.get(key);

  if (!record) {
    throw new HttpError(400, "Tasdiqlash kodi topilmadi. Qayta so'rang.", "OTP_NOT_FOUND");
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(key);
    throw new HttpError(400, "Kod muddati tugagan. Yangi kod so'rang.", "OTP_EXPIRED");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    throw new HttpError(429, "Juda ko'p noto'g'ri urinish. Yangi kod so'rang.", "OTP_MAX_ATTEMPTS");
  }

  const ok = verifyOtpCode(String(code).trim(), record.codeHash);
  if (!ok) {
    record.attempts += 1;
    otpStore.set(key, record);
    throw new HttpError(400, "Tasdiqlash kodi noto'g'ri", "OTP_INVALID");
  }

  otpStore.delete(key);
  return true;
}

module.exports = { createAndSendOtp, verifyOtp };
