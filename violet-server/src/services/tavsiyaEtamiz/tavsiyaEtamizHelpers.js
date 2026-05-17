function norm(v) {
  return (v && String(v).toLowerCase().trim()) || "";
}

function hasLimit(limit) {
  return limit != null && Number.isFinite(Number(limit)) && Number(limit) > 0;
}

function sliceIfLimited(items, limit) {
  if (!hasLimit(limit)) return items;
  return items.slice(0, Math.floor(Number(limit)));
}

function buildProductLookup(allProducts) {
  const productById = new Map();
  const productByIdStr = new Map();
  allProducts.forEach((p) => {
    productById.set(p.id, p);
    productByIdStr.set(String(p.id), p);
  });
  const getProduct = (id) => productById.get(id) ?? productByIdStr.get(String(id));
  return { getProduct };
}

module.exports = {
  norm,
  hasLimit,
  sliceIfLimited,
  buildProductLookup,
};
