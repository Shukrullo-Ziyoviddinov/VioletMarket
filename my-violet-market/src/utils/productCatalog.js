/** Katalog: mahsulotlar massividan bo‘limlar (categoryName bo‘yicha) */

export function isFlashCategoryActive(product) {
  const flag = product?.flashCategoryName;
  if (flag === true || flag === 'true') return true;
  return String(product?.categoryName || '').trim() === 'bigDiscountCollection';
}

export function productsByCategoryName(allProducts, categoryName) {
  const list = Array.isArray(allProducts) ? allProducts : [];
  return list.filter((p) => p.categoryName === categoryName);
}

export function buildProductCollections(allProducts) {
  const list = Array.isArray(allProducts) ? allProducts : [];
  const by = (name) => productsByCategoryName(list, name);
  return {
    allProducts: list,
    products: by("products"),
    newCollection: by("newCollection"),
    womensCollection: by("womensCollection"),
    mensCollection: by("mensCollection"),
    engArzonlare: by("engArzonlare"),
    trendingItems: by("trendingItems"),
    electronicsCollection: by("electronicsCollection"),
    booksCollection: by("booksCollection"),
    stationeryCollection: by("stationeryCollection"),
    beautyCareCollection: by("beautyCareCollection"),
    accessoriesCollection: by("accessoriesCollection"),
    giftsToysCollection: by("giftsToysCollection"),
    vitaminsHealthCollection: by("vitaminsHealthCollection"),
    activeLifestyleCollection: by("activeLifestyleCollection"),
    travelGearCollection: by("travelGearCollection"),
    householdAppliancesCollection: by("householdAppliancesCollection"),
    allKindsProductsCollection: by("allKindsProductsCollection"),
    bigDiscountCollection: list.filter((product) => isFlashCategoryActive(product)),
  };
}
