const SELLER_ACCOUNT_STATUSES = Object.freeze({
  ACTIVE: "active",
  PAUSED: "paused",
});

function normalizeSellerAccountStatus(value) {
  return value === SELLER_ACCOUNT_STATUSES.PAUSED
    ? SELLER_ACCOUNT_STATUSES.PAUSED
    : SELLER_ACCOUNT_STATUSES.ACTIVE;
}

function isSellerAccountPaused(status) {
  return normalizeSellerAccountStatus(status) === SELLER_ACCOUNT_STATUSES.PAUSED;
}

module.exports = {
  SELLER_ACCOUNT_STATUSES,
  normalizeSellerAccountStatus,
  isSellerAccountPaused,
};
