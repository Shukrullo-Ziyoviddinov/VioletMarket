import productCatalog from './product.json';

/**
 * Katalog manbasi: product.json — DB yoki backend export qilgan JSON bilan almashtirish oson.
 * Bo‘lim: har bir mahsulotdagi categoryName (masalan "travelGearCollection").
 */
const normalizeCatalog = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.products)) return raw.products;
  return [];
};

export const allProducts = normalizeCatalog(productCatalog);

const productsByCategory = (categoryName) =>
  allProducts.filter((p) => p.categoryName === categoryName);

export const products = productsByCategory('products');
export const newCollection = productsByCategory('newCollection');
export const womensCollection = productsByCategory('womensCollection');
export const mensCollection = productsByCategory('mensCollection');
export const engArzonlare = productsByCategory('engArzonlare');
export const trendingItems = productsByCategory('trendingItems');
export const electronicsCollection = productsByCategory('electronicsCollection');
export const booksCollection = productsByCategory('booksCollection');
export const stationeryCollection = productsByCategory('stationeryCollection');
export const beautyCareCollection = productsByCategory('beautyCareCollection');
export const accessoriesCollection = productsByCategory('accessoriesCollection');
export const giftsToysCollection = productsByCategory('giftsToysCollection');
export const vitaminsHealthCollection = productsByCategory('vitaminsHealthCollection');
export const activeLifestyleCollection = productsByCategory('activeLifestyleCollection');
export const travelGearCollection = productsByCategory('travelGearCollection');
export const householdAppliancesCollection = productsByCategory('householdAppliancesCollection');
export const allKindsProductsCollection = productsByCategory('allKindsProductsCollection');
export const bigDiscountCollection = productsByCategory('bigDiscountCollection');
