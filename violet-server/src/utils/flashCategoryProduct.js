const FLASH_CATEGORY_SECTION_KEY = "bigDiscountCollection";

function isFlashCategoryActive(product) {
  const flag = product?.flashCategoryName;
  if (flag === true || flag === "true") return true;
  return String(product?.categoryName || "").trim() === FLASH_CATEGORY_SECTION_KEY;
}

module.exports = {
  FLASH_CATEGORY_SECTION_KEY,
  isFlashCategoryActive,
};
