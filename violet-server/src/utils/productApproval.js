/**
 * Xorij silleri mahsulotlari uchun asosiy admin tasdiqlashi.
 * UZB (local) → create da approved + live.
 * foreign → pending + clientActive false; approve da cargoExpressPolicy yoziladi.
 */

const { HttpError } = require("./httpError");

const PRODUCT_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const CARGO_EXPRESS_POLICY = {
  UNRESTRICTED: "unrestricted",
  STANDARD_ONLY: "standard_only",
};

function normalizeCargoExpressPolicy(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === CARGO_EXPRESS_POLICY.STANDARD_ONLY) {
    return CARGO_EXPRESS_POLICY.STANDARD_ONLY;
  }
  if (raw === CARGO_EXPRESS_POLICY.UNRESTRICTED) {
    return CARGO_EXPRESS_POLICY.UNRESTRICTED;
  }
  return null;
}

function requireCargoExpressPolicy(value) {
  const policy = normalizeCargoExpressPolicy(value);
  if (!policy) {
    throw new HttpError(
      400,
      "cargoExpressPolicy: unrestricted yoki standard_only bo'lishi shart",
      "VALIDATION_ERROR",
    );
  }
  return policy;
}

function normalizeApprovalStatus(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    raw === PRODUCT_APPROVAL_STATUS.PENDING ||
    raw === PRODUCT_APPROVAL_STATUS.APPROVED ||
    raw === PRODUCT_APPROVAL_STATUS.REJECTED
  ) {
    return raw;
  }
  return null;
}

/** Clientda ko'rinishi mumkinmi (pending/rejected yo'q). */
function isProductApprovalVisibleOnClient(product) {
  const status = normalizeApprovalStatus(product?.approvalStatus);
  if (status === PRODUCT_APPROVAL_STATUS.PENDING) return false;
  if (status === PRODUCT_APPROVAL_STATUS.REJECTED) return false;
  return true;
}

/** Create payload: foreign → pending; local → approved + live. */
function buildCreateApprovalFields(pipelineMode) {
  if (pipelineMode === "foreign") {
    return {
      clientActive: false,
      pausedBySeller: false,
      approvalStatus: PRODUCT_APPROVAL_STATUS.PENDING,
      cargoExpressPolicy: null,
    };
  }

  return {
    clientActive: true,
    pausedBySeller: false,
    approvalStatus: PRODUCT_APPROVAL_STATUS.APPROVED,
    cargoExpressPolicy: null,
  };
}

module.exports = {
  PRODUCT_APPROVAL_STATUS,
  CARGO_EXPRESS_POLICY,
  normalizeCargoExpressPolicy,
  requireCargoExpressPolicy,
  normalizeApprovalStatus,
  isProductApprovalVisibleOnClient,
  buildCreateApprovalFields,
};
