const crypto = require("crypto");
const mongoose = require("mongoose");
const { verifyUserToken } = require("../utils/jwt");
const { UserActivityDaily } = require("../models/userActivityDaily");
const { getStatisticsDateKey } = require("../utils/customerStatisticsDate");

function normalizeForwardedIp(value) {
  const raw = String(value || "").split(",")[0].trim();
  return raw || "";
}

function getClientIp(req) {
  const forwarded = normalizeForwardedIp(req.headers["x-forwarded-for"]);
  if (forwarded) return forwarded;
  return String(req.ip || req.socket?.remoteAddress || "").trim();
}

function tryResolveUserId(req) {
  const header = String(req.headers.authorization || "");
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    return verifyUserToken(token);
  } catch {
    return null;
  }
}

function buildGuestVisitorKey(req) {
  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");
  const hash = crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 24);
  return `g:${hash}`;
}

function shouldTrackRequest(req) {
  if (req.method === "OPTIONS") return false;
  const path = String(req.path || "");
  if (!path.startsWith("/api/")) return false;
  if (path.startsWith("/api/admin/")) return false;
  return true;
}

async function storeActivity(req) {
  if (mongoose.connection.readyState !== 1) return;

  const userId = req.userId || tryResolveUserId(req);
  const isRegistered = Boolean(userId);
  const visitorKey = isRegistered ? `u:${String(userId)}` : buildGuestVisitorKey(req);
  const dateKey = getStatisticsDateKey(new Date());

  await UserActivityDaily.updateOne(
    { dateKey, visitorKey },
    {
      $set: {
        userId: isRegistered ? userId : null,
        isRegistered,
        lastSeenAt: new Date(),
      },
      $setOnInsert: {
        dateKey,
        visitorKey,
      },
    },
    { upsert: true },
  );
}

function activityTrackerMiddleware(req, _res, next) {
  if (!shouldTrackRequest(req)) {
    next();
    return;
  }

  storeActivity(req).catch(() => {
    // Tracking xatosi API ni to'xtatmasligi kerak.
  });

  next();
}

module.exports = { activityTrackerMiddleware };
