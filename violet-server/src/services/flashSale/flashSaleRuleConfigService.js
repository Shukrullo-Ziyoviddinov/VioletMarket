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
