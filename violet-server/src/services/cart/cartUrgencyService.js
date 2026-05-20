const URGENCY_RESHOW_DELAY_MS = 60 * 1000;
const BASE_COUNTDOWN_MS = 60 * 60 * 1000;
const COUNTDOWN_STEP_MS = 10 * 60 * 1000;
const COUNTDOWN_VARIANTS = 6;

function generateInitialUrgencyStock() {
  return Math.floor(Math.random() * 4) + 3; // 3..6
}

function buildNextShowAt(baseMs = Date.now()) {
  return new Date(baseMs + URGENCY_RESHOW_DELAY_MS);
}

function hashString(value) {
  let hash = 0;
  const str = String(value || "");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildUrgencyDurationMs(seed) {
  const variant = hashString(seed) % COUNTDOWN_VARIANTS;
  return BASE_COUNTDOWN_MS + variant * COUNTDOWN_STEP_MS;
}

function buildUrgencyEndsAt(durationMs, baseMs = Date.now()) {
  const safeDuration = Number.isFinite(durationMs) ? durationMs : BASE_COUNTDOWN_MS;
  return new Date(baseMs + safeDuration);
}

function toClientUrgencyNextShowAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

module.exports = {
  URGENCY_RESHOW_DELAY_MS,
  generateInitialUrgencyStock,
  buildNextShowAt,
  buildUrgencyDurationMs,
  buildUrgencyEndsAt,
  toClientUrgencyNextShowAt,
};
