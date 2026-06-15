function isProductActiveOnClient(product) {
  if (!product || typeof product !== "object") return false;
  return product.clientActive !== false;
}

function filterProductsActiveOnClient(products) {
  return (Array.isArray(products) ? products : []).filter(isProductActiveOnClient);
}

const CLIENT_ACTIVE_FILTER = { clientActive: { $ne: false } };

module.exports = {
  isProductActiveOnClient,
  filterProductsActiveOnClient,
  CLIENT_ACTIVE_FILTER,
};
