const PAUSED_BY_SELLER_FILTER = { pausedBySeller: true };

function isProductPausedBySeller(product) {
  return Boolean(product?.pausedBySeller);
}

module.exports = {
  PAUSED_BY_SELLER_FILTER,
  isProductPausedBySeller,
};
