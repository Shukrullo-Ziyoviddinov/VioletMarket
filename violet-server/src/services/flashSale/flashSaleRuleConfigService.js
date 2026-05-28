const { FlashSaleRuleConfig } = require("../../models/flashSaleRuleConfig");
const { HttpError } = require("../../utils/httpError");

const DEFAULT_RULES = Object.freeze({
  key: "default",
  minSoldCount: 5,
  minCartUsers: 5,
  lowStockThreshold: 15,
  highStockThreshold: 20,
  rotateEveryMs: 5000,
  active: true,
  liveMinViewers: 50,
  liveMaxViewers: 1000,
  liveUpdateEveryMs: 1000,
  liveModeRotateEveryMs: 7000,
  liveNormalStepMin: 5,
  liveNormalStepMax: 40,
  liveSurgeStepMin: 35,
  liveSurgeStepMax: 140,
  liveCooldownStepMin: 35,
  liveCooldownStepMax: 140,
  liveSpikeChancePercent: 18,
});

const CACHE_TTL_MS = 10000;
let cachedRules = null;
let cachedAt = 0;

function toNonNegativeInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function normalizeRules(raw) {
  const rules = {
    ...DEFAULT_RULES,
    ...(raw || {}),
  };
  return {
    key: "default",
    minSoldCount: toNonNegativeInt(rules.minSoldCount, DEFAULT_RULES.minSoldCount),
    minCartUsers: toNonNegativeInt(rules.minCartUsers, DEFAULT_RULES.minCartUsers),
    lowStockThreshold: toNonNegativeInt(
      rules.lowStockThreshold,
      DEFAULT_RULES.lowStockThreshold,
    ),
    highStockThreshold: toNonNegativeInt(
      rules.highStockThreshold,
      DEFAULT_RULES.highStockThreshold,
    ),
    rotateEveryMs: Math.max(1000, toNonNegativeInt(rules.rotateEveryMs, DEFAULT_RULES.rotateEveryMs)),
    active: rules.active !== false,
    liveMinViewers: Math.max(1, toNonNegativeInt(rules.liveMinViewers, DEFAULT_RULES.liveMinViewers)),
    liveMaxViewers: Math.max(1, toNonNegativeInt(rules.liveMaxViewers, DEFAULT_RULES.liveMaxViewers)),
    liveUpdateEveryMs: Math.max(
      250,
      toNonNegativeInt(rules.liveUpdateEveryMs, DEFAULT_RULES.liveUpdateEveryMs),
    ),
    liveModeRotateEveryMs: Math.max(
      1000,
      toNonNegativeInt(rules.liveModeRotateEveryMs, DEFAULT_RULES.liveModeRotateEveryMs),
    ),
    liveNormalStepMin: Math.max(
      1,
      toNonNegativeInt(rules.liveNormalStepMin, DEFAULT_RULES.liveNormalStepMin),
    ),
    liveNormalStepMax: Math.max(
      1,
      toNonNegativeInt(rules.liveNormalStepMax, DEFAULT_RULES.liveNormalStepMax),
    ),
    liveSurgeStepMin: Math.max(
      1,
      toNonNegativeInt(rules.liveSurgeStepMin, DEFAULT_RULES.liveSurgeStepMin),
    ),
    liveSurgeStepMax: Math.max(
      1,
      toNonNegativeInt(rules.liveSurgeStepMax, DEFAULT_RULES.liveSurgeStepMax),
    ),
    liveCooldownStepMin: Math.max(
      1,
      toNonNegativeInt(rules.liveCooldownStepMin, DEFAULT_RULES.liveCooldownStepMin),
    ),
    liveCooldownStepMax: Math.max(
      1,
      toNonNegativeInt(rules.liveCooldownStepMax, DEFAULT_RULES.liveCooldownStepMax),
    ),
    liveSpikeChancePercent: Math.max(
      0,
      Math.min(100, toNonNegativeInt(rules.liveSpikeChancePercent, DEFAULT_RULES.liveSpikeChancePercent)),
    ),
  };
}

function validateRules(rules) {
  const errors = [];
  const checks = [
    "minSoldCount",
    "minCartUsers",
    "lowStockThreshold",
    "highStockThreshold",
    "rotateEveryMs",
    "liveMinViewers",
    "liveMaxViewers",
    "liveUpdateEveryMs",
    "liveModeRotateEveryMs",
    "liveNormalStepMin",
    "liveNormalStepMax",
    "liveSurgeStepMin",
    "liveSurgeStepMax",
    "liveCooldownStepMin",
    "liveCooldownStepMax",
    "liveSpikeChancePercent",
  ];
  for (const key of checks) {
    const n = Number(rules[key]);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${key} musbat son bo'lishi kerak`);
    }
  }

  if (Number(rules.rotateEveryMs) < 1000) {
    errors.push("rotateEveryMs kamida 1000 bo'lishi kerak");
  }
  if (Number(rules.liveMinViewers) > Number(rules.liveMaxViewers)) {
    errors.push("liveMinViewers liveMaxViewers dan kichik yoki teng bo'lishi kerak");
  }
  if (Number(rules.liveNormalStepMin) > Number(rules.liveNormalStepMax)) {
    errors.push("liveNormalStepMin liveNormalStepMax dan kichik yoki teng bo'lishi kerak");
  }
  if (Number(rules.liveSurgeStepMin) > Number(rules.liveSurgeStepMax)) {
    errors.push("liveSurgeStepMin liveSurgeStepMax dan kichik yoki teng bo'lishi kerak");
  }
  if (Number(rules.liveCooldownStepMin) > Number(rules.liveCooldownStepMax)) {
    errors.push("liveCooldownStepMin liveCooldownStepMax dan kichik yoki teng bo'lishi kerak");
  }
  return errors;
}

function clearRulesCache() {
  cachedRules = null;
  cachedAt = 0;
}

async function getFlashSaleRules({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && cachedRules && now - cachedAt < CACHE_TTL_MS) {
    return cachedRules;
  }

  const row = await FlashSaleRuleConfig.findOne({ key: "default" }).lean();
  const normalized = normalizeRules(row || DEFAULT_RULES);
  cachedRules = normalized;
  cachedAt = now;
  return normalized;
}

async function updateFlashSaleRules(patch) {
  const current = await getFlashSaleRules({ bypassCache: true });
  const next = normalizeRules({ ...current, ...(patch || {}) });
  const errors = validateRules(next);
  if (errors.length > 0) {
    throw new HttpError(400, "Flash sale qoidalari noto'g'ri", "INVALID_FLASH_SALE_RULES", errors);
  }

  await FlashSaleRuleConfig.findOneAndUpdate(
    { key: "default" },
    { $set: next },
    { upsert: true },
  );
  clearRulesCache();
  return getFlashSaleRules({ bypassCache: true });
}

module.exports = {
  DEFAULT_RULES,
  getFlashSaleRules,
  updateFlashSaleRules,
  clearRulesCache,
};
