function parseDurationHours(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseProductId(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function durationToMs(hours) {
  return hours * 60 * 60 * 1000;
}

function buildClientPayload(row, now = new Date()) {
  const totalMs = durationToMs(row.durationHours);
  const nowMs = now.getTime();
  const endMs = row.cycleEndsAt.getTime();
  const timeLeftMs = Math.max(0, endMs - nowMs);
  const progressPercent =
    totalMs > 0
      ? Math.min(100, Math.max(0, 100 - (timeLeftMs / totalMs) * 100))
      : 0;

  return {
    productId: row.productId,
    durationHours: row.durationHours,
    cycleEndsAt: row.cycleEndsAt.toISOString(),
    serverNow: now.toISOString(),
    timeLeftMs,
    progressPercent,
  };
}

module.exports = {
  parseDurationHours,
  parseProductId,
  durationToMs,
  buildClientPayload,
};
