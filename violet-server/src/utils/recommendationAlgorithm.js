/** O'xshash mahsulotlar (Recommended komponenti) — productType + productCountry */

function getRelatedByTypeAndCountry(currentProduct, allProducts) {
  if (!currentProduct?.productType || !currentProduct?.productCountry) return [];
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

  return allProducts.filter((p) => {
    if (p.id === currentProduct.id) return false;
    return (
      p.productType === currentProduct.productType &&
      p.productCountry === currentProduct.productCountry
    );
  });
}

module.exports = {
  getRelatedByTypeAndCountry,
};
