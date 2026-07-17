const crypto = require("crypto");
const authConfig = require("../../config/auth");
const { DeliveryAuthCode } = require("../../models/deliveryAuthCode");
const { sendOtpEmail } = require("../login/brevoMailService");
const { HttpError } = require("../../utils/httpError");

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000;

function hashCode(code) {
  const secret =
    String(process.env.OTP_PEPPER || "").trim() || authConfig.jwtSecret;
  return crypto.createHmac("sha256", secret).update(String(code)).digest("hex");
}

function codesMatch(code, hash) {
  const actual = Buffer.from(hashCode(code), "hex");
  const expected = Buffer.from(hash, "hex");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

async function createAndSendDeliveryOtp(email, purpose) {
  const now = new Date();
  const existing = await DeliveryAuthCode.findOne({ email, purpose }).lean();

  if (
    existing &&
    now.getTime() - new Date(existing.sentAt).getTime() < RESEND_COOLDOWN_MS
  ) {
    const retryAfterSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS -
        (now.getTime() - new Date(existing.sentAt).getTime())) /
        1000,
    );
    throw new HttpError(
      429,
      `Yangi kodni ${retryAfterSeconds} soniyadan keyin so'rang`,
      "OTP_COOLDOWN",
      { retryAfterSeconds },
    );
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(now.getTime() + authConfig.otpExpiryMs);

  await DeliveryAuthCode.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        codeHash: hashCode(code),
        attempts: 0,
        sentAt: now,
        expiresAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    await DeliveryAuthCode.deleteOne({ email, purpose });
    throw error;
  }

  return {
    expiresInSeconds: Math.floor(authConfig.otpExpiryMs / 1000),
    resendAfterSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
  };
}

async function verifyDeliveryOtp(email, purpose, rawCode) {
  const code = String(rawCode || "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpError(400, "6 xonali kodni kiriting", "OTP_INVALID");
  }

  const record = await DeliveryAuthCode.findOne({ email, purpose });
  if (!record) {
    throw new HttpError(
      400,
      "Tasdiqlash kodi topilmadi. Yangi kod so'rang.",
      "OTP_NOT_FOUND",
    );
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await record.deleteOne();
    throw new HttpError(
      400,
      "Kod muddati tugagan. Yangi kod so'rang.",
      "OTP_EXPIRED",
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new HttpError(
      429,
      "Juda ko'p noto'g'ri urinish. Yangi kod so'rang.",
      "OTP_MAX_ATTEMPTS",
    );
  }

  if (!codesMatch(code, record.codeHash)) {
    record.attempts += 1;
    await record.save();
    throw new HttpError(400, "Tasdiqlash kodi noto'g'ri", "OTP_INVALID");
  }

  await record.deleteOne();
}

module.exports = {
  createAndSendDeliveryOtp,
  verifyDeliveryOtp,
};
