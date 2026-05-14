/** Katalog: mahsulotlar massividan bo‘limlar (categoryName bo‘yicha) */

export function productsByCategoryName(allProducts, categoryName) {
  const list = Array.isArray(allProducts) ? allProducts : [];
  return list.filter((p) => p.categoryName === categoryName);
}

export function buildProductCollections(allProducts) {
  const by = (name) => productsByCategoryName(allProducts, name);
  return {
    allProducts: Array.isArray(allProducts) ? allProducts : [],
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
    bigDiscountCollection: by("bigDiscountCollection"),
  };
}
