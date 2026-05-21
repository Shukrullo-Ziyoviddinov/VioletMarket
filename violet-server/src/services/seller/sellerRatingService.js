const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { parseSellerId } = require("./sellerHelpers");
const { getSellerRatingSummaryCached } = require("./sellerRatingOptimizationService");

async function getSellerRatingSummary(sellerIdRaw) {
  const sellerId = parseSellerId(sellerIdRaw);
  const seller = await SellerAccount.findOne({ id: sellerId }).lean();
  if (!seller) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  return getSellerRatingSummaryCached(sellerId);
}

module.exports = { getSellerRatingSummary };
