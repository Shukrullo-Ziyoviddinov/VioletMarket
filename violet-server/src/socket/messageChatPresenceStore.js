function createPresenceEntry() {
  return {
    socketCount: 0,
    isOnline: false,
    lastActiveAt: null,
  };
}

const userPresence = new Map();
const sellerPresence = new Map();

function getUserPresence(userId) {
  const id = String(userId || "").trim();
  if (!id) return null;
  return userPresence.get(id) || createPresenceEntry();
}

function getSellerPresence(sellerId) {
  const id = String(sellerId || "").trim();
  if (!id) return null;
  return sellerPresence.get(id) || createPresenceEntry();
}

function toPresencePayload(kind, id, entry) {
  return {
    kind,
    userId: kind === "user" ? id : null,
    sellerId: kind === "seller" ? id : null,
    isOnline: Boolean(entry.isOnline),
    lastActiveAt: entry.lastActiveAt ? new Date(entry.lastActiveAt).toISOString() : null,
  };
}

function markUserOnline(userId) {
  const id = String(userId || "").trim();
  if (!id) return null;

  const entry = getUserPresence(id);
  entry.socketCount += 1;
  entry.isOnline = true;
  userPresence.set(id, entry);
  return toPresencePayload("user", id, entry);
}

function markUserOffline(userId) {
  const id = String(userId || "").trim();
  if (!id) return null;

  const entry = getUserPresence(id);
  entry.socketCount = Math.max(0, entry.socketCount - 1);
  if (entry.socketCount === 0) {
    entry.isOnline = false;
    entry.lastActiveAt = new Date();
  }
  userPresence.set(id, entry);
  return toPresencePayload("user", id, entry);
}

function markSellerOnline(sellerId) {
  const id = String(sellerId || "").trim();
  if (!id) return null;

  const entry = getSellerPresence(id);
  entry.socketCount += 1;
  entry.isOnline = true;
  sellerPresence.set(id, entry);
  return toPresencePayload("seller", id, entry);
}

function markSellerOffline(sellerId) {
  const id = String(sellerId || "").trim();
  if (!id) return null;

  const entry = getSellerPresence(id);
  entry.socketCount = Math.max(0, entry.socketCount - 1);
  if (entry.socketCount === 0) {
    entry.isOnline = false;
    entry.lastActiveAt = new Date();
  }
  sellerPresence.set(id, entry);
  return toPresencePayload("seller", id, entry);
}

function getUserPresencePayload(userId) {
  const id = String(userId || "").trim();
  if (!id) return null;
  return toPresencePayload("user", id, getUserPresence(id));
}

function getSellerPresencePayload(sellerId) {
  const id = String(sellerId || "").trim();
  if (!id) return null;
  return toPresencePayload("seller", id, getSellerPresence(id));
}

module.exports = {
  markUserOnline,
  markUserOffline,
  markSellerOnline,
  markSellerOffline,
  getUserPresencePayload,
  getSellerPresencePayload,
};
