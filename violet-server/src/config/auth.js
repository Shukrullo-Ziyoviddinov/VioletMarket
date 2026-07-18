function trimEnv(value) {
  return String(value || "").trim();
}

const brevoApiKey = trimEnv(process.env.BREVO_API_KEY);
const brevoSenderEmail = trimEnv(process.env.BREVO_SENDER_EMAIL);
const brevoSenderName = trimEnv(process.env.BREVO_SENDER_NAME) || "Violet Market";
const jwtSecret = trimEnv(process.env.JWT_SECRET) || "violet-market-dev-secret-change-me";
const jwtExpiresIn = trimEnv(process.env.JWT_EXPIRES_IN) || "30d";
const otpExpiryMs = parseInt(process.env.OTP_EXPIRY_MS || "60000", 10);
/** Emaildagi logo uchun — saytning ochiq URL i (masalan https://violetmarket.uz) */
const publicSiteUrl = trimEnv(process.env.PUBLIC_SITE_URL).replace(/\/+$/, "");
/** Admin Socket.IO ulanishi uchun (admin panelda token yo‘q) */
const adminSocketKey =
  trimEnv(process.env.ADMIN_SOCKET_KEY) || "violet-admin-socket-dev-key";

module.exports = {
  brevoApiKey,
  brevoSenderEmail,
  brevoSenderName,
  publicSiteUrl,
  jwtSecret,
  jwtExpiresIn,
  otpExpiryMs,
  adminSocketKey,
  /** API kalit bo'lsa yetarli — sender .env dan yoki Brevo API dan avto olinadi */
  isBrevoConfigured: () => Boolean(brevoApiKey),
};
