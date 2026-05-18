const { HttpError } = require("../../utils/httpError");

function parseSellerId(raw) {
  const sellerId = String(raw ?? "").trim();
  if (!sellerId) {
    throw new HttpError(400, "Sotuvchi ID noto'g'ri", "INVALID_SELLER_ID");
  }
  return sellerId;
}

module.exports = { parseSellerId };
