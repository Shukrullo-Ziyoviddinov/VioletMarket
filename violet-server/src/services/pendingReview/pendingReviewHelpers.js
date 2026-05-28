const MAX_NAME_LENGTH = 300;

function getProductDisplayTitle(product) {
  const title = product?.title;
  if (typeof title === "string") {
    const name = title.trim() || "Mahsulot";
    return { uz: name, ru: name };
  }
  if (title && typeof title === "object") {
    const uz = String(title.uz || "").trim() || "Mahsulot";
    const ru = String(title.ru || title.uz || "").trim() || uz;
    return { uz, ru };
  }
  return { uz: "Mahsulot", ru: "Mahsulot" };
}

function getProductDisplayImage(product) {
  const firstColor = product?.colors?.[0];
  return (
    firstColor?.mainImage ||
    product?.image ||
    product?.mainImage ||
    null
  );
}

function trimTitleForStorage(titleObj) {
  const out = { uz: titleObj.uz, ru: titleObj.ru };
  for (const key of ["uz", "ru"]) {
    if (out[key].length > MAX_NAME_LENGTH) {
      out[key] = `${out[key].slice(0, MAX_NAME_LENGTH)}…`;
    }
  }
  return out;
}

module.exports = {
  getProductDisplayTitle,
  getProductDisplayImage,
  trimTitleForStorage,
};
