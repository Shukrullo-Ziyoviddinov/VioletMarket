const { Product } = require("../../models/product");
const { getProductDisplayPrice } = require("../viewedAt/viewedAtHelpers");
const { parsePagination, parseSort, stripMongoMeta } = require("../../utils/paginationHelpers");
const { parseCategoryName } = require("./collectionHelpers");

function resolveSort(categoryName, sort) {
  if (sort !== "default") return sort;
  if (categoryName === "engArzonlare") return "price-asc";
  return "default";
}

function sortProducts(products, sort) {
  const list = [...products];
  if (sort === "price-asc") {
    list.sort((a, b) => getProductDisplayPrice(a) - getProductDisplayPrice(b));
  } else if (sort === "price-desc") {
    list.sort((a, b) => getProductDisplayPrice(b) - getProductDisplayPrice(a));
  } else {
    list.sort((a, b) => Number(b.id) - Number(a.id));
  }
  return list;
}

function keepNewestProductPerId(products) {
  const sortedByNewest = [...(Array.isArray(products) ? products : [])].sort((a, b) =>
    String(b?._id || "").localeCompare(String(a?._id || "")),
  );
  const seen = new Set();
  const unique = [];

  for (const product of sortedByNewest) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

async function getCollectionProducts(categoryNameRaw, query) {
  const categoryName = parseCategoryName(categoryNameRaw);
  const { page, limit, skip } = parsePagination(query);
  const sort = resolveSort(categoryName, parseSort(query?.sort));

  const allForCategory = keepNewestProductPerId(await Product.find({ categoryName }).lean());
  const total = allForCategory.length;
  const sorted = sortProducts(allForCategory, sort);
  const slice = sorted.slice(skip, skip + limit).map(stripMongoMeta);

  return {
    categoryName,
    products: slice,
    page,
    limit,
    total,
    hasMore: skip + slice.length < total,
    sort,
  };
}

module.exports = {
  getCollectionProducts,
};
