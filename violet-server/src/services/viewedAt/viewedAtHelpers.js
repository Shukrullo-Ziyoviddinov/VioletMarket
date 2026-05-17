const MAX_NAME_LENGTH = 300;

function getProductDisplayName(product) {
  const title = product?.title;
  let name = "Mahsulot";
  if (typeof title === "string") {
    name = title.trim() || "Mahsulot";
  } else if (title && typeof title === "object") {
    name = String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `${name.slice(0, MAX_NAME_LENGTH)}…`;
  }
  return name;
}
function parsePriceValue(val) {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const str = String(val).replace(/\s/g, "").replace(/UZS/gi, "").replace(/so'm/gi, "").replace(/\$/g, "").replace(/,/g, "").trim();
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : null;
}

function getProductDisplayPrice(product) {
  const firstColor = product?.colors?.[0];
  return (
    parsePriceValue(firstColor?.price) ??
    parsePriceValue(product?.price) ??
    parsePriceValue(firstColor?.originalPrice) ??
    parsePriceValue(product?.originalPrice) ??
    0
  );
}

module.exports = {
  getProductDisplayName,
  getProductDisplayPrice,
};
