const { HttpError } = require("../../utils/httpError");
const {
  DEFAULT_LIMIT,
  parsePagination,
  parseSort,
  stripMongoMeta,
} = require("../../utils/paginationHelpers");

function parseSellerId(raw) {
  const sellerId = String(raw ?? "").trim();
  if (!sellerId) {
    throw new HttpError(400, "Sotuvchi ID noto'g'ri", "INVALID_SELLER_ID");
  }
  return sellerId;
}

module.exports = {
  DEFAULT_LIMIT,
  parseSellerId,
  parsePagination,
  parseSort,
  stripMongoMeta,
};
