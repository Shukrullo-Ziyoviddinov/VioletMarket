const { CourierPaymentSettings, DEFAULT_COURIER_PAYMENT_TIERS } = require("../../models/courierPaymentSettings");
const { HttpError } = require("../../utils/httpError");

function normalizeTier(raw, index = 0) {
  return {
    minKm: Math.max(0, Number(raw?.minKm) || 0),
    maxKm: Math.max(0, Number(raw?.maxKm) || 0),
    amount: Math.max(0, Math.round(Number(raw?.amount) || 0)),
    order: index,
  };
}

function normalizeTiers(tiers = []) {
  if (!Array.isArray(tiers) || !tiers.length) {
    return DEFAULT_COURIER_PAYMENT_TIERS.map(normalizeTier);
  }
  return tiers
    .map(normalizeTier)
    .sort((a, b) => a.minKm - b.minKm || a.maxKm - b.maxKm);
}

function validateTiers(tiers) {
  if (!Array.isArray(tiers) || !tiers.length) {
    throw new HttpError(400, "Kamida bitta tarif bo‘lishi kerak", "INVALID_TIERS");
  }
  for (const tier of tiers) {
    if (tier.maxKm > 0 && tier.maxKm <= tier.minKm) {
      throw new HttpError(
        400,
        "Maksimal km minimal km dan katta bo‘lishi kerak",
        "INVALID_TIER_RANGE",
      );
    }
  }
}

/**
 * Masofa bo‘yicha to‘lov:
 * 1–5 km -> 15000, 5–10 -> 25000, 10–20 -> 35000,
 * 20–30 -> 45000, 30–40 -> 55000 (default).
 * Chegara: birinchi tier d>=min, keyingilarda d>min && d<=max.
 */
function resolveCourierPaymentForDistance(distanceKm, tiers) {
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance) || distance < 0) return 0;

  const normalized = normalizeTiers(tiers);
  for (let i = 0; i < normalized.length; i += 1) {
    const tier = normalized[i];
    const isFirst = i === 0;
    const isLast = i === normalized.length - 1;
    const aboveMin = isFirst ? distance >= tier.minKm : distance > tier.minKm;
    const belowMax =
      isLast || tier.maxKm <= 0 ? true : distance <= tier.maxKm;
    if (aboveMin && belowMax) {
      return tier.amount;
    }
  }

  return normalized[normalized.length - 1]?.amount || 0;
}

async function getCourierPaymentSettings() {
  let doc = await CourierPaymentSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    doc = (
      await CourierPaymentSettings.create({
        key: "default",
        tiers: DEFAULT_COURIER_PAYMENT_TIERS,
      })
    ).toObject();
  }
  return {
    tiers: normalizeTiers(doc.tiers),
    updatedAt: doc.updatedAt || null,
  };
}

async function updateCourierPaymentSettings(payload = {}) {
  const tiers = normalizeTiers(payload.tiers);
  validateTiers(tiers);

  const doc = await CourierPaymentSettings.findOneAndUpdate(
    { key: "default" },
    { $set: { tiers } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return {
    tiers: normalizeTiers(doc.tiers),
    updatedAt: doc.updatedAt || null,
  };
}

module.exports = {
  getCourierPaymentSettings,
  updateCourierPaymentSettings,
  resolveCourierPaymentForDistance,
  normalizeTiers,
};
