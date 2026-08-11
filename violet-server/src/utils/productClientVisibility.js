const {
  isProductApprovalVisibleOnClient,
} = require("./productApproval");

function isProductActiveOnClient(product) {
  if (!product || typeof product !== "object") return false;
  if (product.clientActive === false) return false;
  return isProductApprovalVisibleOnClient(product);
}

function filterProductsActiveOnClient(products) {
  return (Array.isArray(products) ? products : []).filter(isProductActiveOnClient);
}

/** Mongo filter: live + pending/rejected emas (yo'q maydon = eski live mahsulot). */
const CLIENT_ACTIVE_FILTER = {
  clientActive: { $ne: false },
  approvalStatus: { $nin: ["pending", "rejected"] },
};

module.exports = {
  isProductActiveOnClient,
  filterProductsActiveOnClient,
  CLIENT_ACTIVE_FILTER,
};
