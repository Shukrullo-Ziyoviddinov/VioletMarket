const FLASH_SECTION_CATEGORY_NAMES = [
  "products",
  "newCollection",
  "womensCollection",
  "mensCollection",
  "engArzonlare",
  "trendingItems",
  "electronicsCollection",
  "booksCollection",
  "stationeryCollection",
  "beautyCareCollection",
  "accessoriesCollection",
  "giftsToysCollection",
  "vitaminsHealthCollection",
  "activeLifestyleCollection",
  "travelGearCollection",
  "householdAppliancesCollection",
  "allKindsProductsCollection",
];

const FLASH_SECTION_CATEGORY_LABELS = {
  products: "Mahsulotlar",
  newCollection: "Yangi kolleksiya",
  womensCollection: "Ayollar kolleksiyasi",
  mensCollection: "Erkaklar kolleksiyasi",
  engArzonlare: "Eng arzonlar",
  trendingItems: "Trenddagilar",
  electronicsCollection: "Elektronika",
  booksCollection: "Kitoblar",
  stationeryCollection: "Kanselyariya",
  beautyCareCollection: "Go'zallik va parvarish",
  accessoriesCollection: "Aksessuarlar",
  giftsToysCollection: "Sovg'alar va o'yinchoqlar",
  vitaminsHealthCollection: "Vitaminlar va sog'liq",
  activeLifestyleCollection: "Faol hayot tarzi",
  travelGearCollection: "Sayohat jihozlari",
  householdAppliancesCollection: "Maishiy texnika",
  allKindsProductsCollection: "Har xil mahsulotlar",
};

function normalizeFlashCategoryFlag(raw) {
  if (raw === true || raw === "true") return "true";
  return "false";
}

function isFlashCategoryActive(product) {
  if (normalizeFlashCategoryFlag(product?.flashCategoryName) === "true") {
    return true;
  }

  return String(product?.categoryName || "").trim() === "bigDiscountCollection";
}

module.exports = {
  FLASH_SECTION_CATEGORY_NAMES,
  FLASH_SECTION_CATEGORY_LABELS,
  normalizeFlashCategoryFlag,
  isFlashCategoryActive,
};
