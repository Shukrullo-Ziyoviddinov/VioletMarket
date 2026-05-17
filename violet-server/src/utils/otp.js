const crypto = require("crypto");

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtpCode(code) {
  const pepper = process.env.OTP_PEPPER || "violet-market-otp";
  return crypto.createHash("sha256").update(`${code}:${pepper}`).digest("hex");
}

function verifyOtpCode(code, hash) {
  return hashOtpCode(code) === hash;
}

module.exports = { generateOtpCode, hashOtpCode, verifyOtpCode };
