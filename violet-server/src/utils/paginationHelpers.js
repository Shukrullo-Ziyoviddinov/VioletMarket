const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 48;

const SORT_VALUES = new Set(["default", "newest", "price-asc", "price-desc"]);

function parsePagination(query) {
  let page = Number.parseInt(query?.page, 10);
  let limit = Number.parseInt(query?.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function parseSort(raw) {
  const sort = String(raw ?? "default").trim().toLowerCase();
  return SORT_VALUES.has(sort) ? sort : "default";
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  parseSort,
  stripMongoMeta,
};
