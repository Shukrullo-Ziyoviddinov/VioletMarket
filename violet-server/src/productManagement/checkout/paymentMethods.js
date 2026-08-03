const { HttpError } = require("../../utils/httpError");

const VALID_PAYMENT_METHODS = new Set(["payme", "click", "on_delivery", "mock"]);

const PAYMENT_METHOD_ALIASES = {
  payme: "payme",
  click: "click",
  on_delivery: "on_delivery",
  cash: "on_delivery",
  naqt: "on_delivery",
  naqd: "on_delivery",
  mock: "mock",
};

function normalizePaymentMethod(raw, { allowMock = true } = {}) {
  const method = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (!method) {
    if (allowMock) return "mock";
    throw new HttpError(400, "To'lov usulini tanlang", "PAYMENT_METHOD_REQUIRED");
  }

  const normalized = PAYMENT_METHOD_ALIASES[method] || method;
  if (!VALID_PAYMENT_METHODS.has(normalized)) {
    throw new HttpError(400, "To'lov usuli noto'g'ri", "VALIDATION_ERROR");
  }

  if (!allowMock && normalized === "mock") {
    throw new HttpError(400, "To'lov usulini tanlang", "PAYMENT_METHOD_REQUIRED");
  }

  return normalized;
}

function resolveStoredPaymentMethod(raw) {
  try {
    return normalizePaymentMethod(raw, { allowMock: true });
  } catch {
    return "mock";
  }
}

module.exports = {
  VALID_PAYMENT_METHODS,
  PAYMENT_METHOD_ALIASES,
  normalizePaymentMethod,
  resolveStoredPaymentMethod,
};
