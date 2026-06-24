const { SellerAccount } = require("../../models/sellerAccount");
const { SellerRegistration } = require("../../models/sellerRegistration");
const { HttpError } = require("../../utils/httpError");
const { assertValidShopId } = require("../../utils/shopId");
const {
  SELLER_ACCOUNT_STATUSES,
  normalizeSellerAccountStatus,
} = require("../../utils/sellerAccountStatus");
const { toSellerAccountPublic } = require("./sellerAccountMapper");
const {
  pauseProductsForSeller,
  activateProductsForSeller,
} = require("./sellerProductPauseService");
const { deleteSellerCompletely } = require("./sellerCascadeDeleteService");

async function getApprovedSellerAccount(shopIdRaw) {
  const shopId = assertValidShopId(shopIdRaw);

  const registration = await SellerRegistration.findOne({
    shopId,
    status: "approved",
  });
  if (!registration) {
    throw new HttpError(404, "Tasdiqlangan sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  const sellerAccount = await SellerAccount.findOne({ id: shopId });
  if (!sellerAccount) {
    throw new HttpError(404, "Do'kon profili topilmadi", "SELLER_ACCOUNT_NOT_FOUND");
  }

  return { shopId, registration, sellerAccount };
}

async function setSellerAccountStatus(shopIdRaw, nextStatus) {
  const { shopId, sellerAccount } = await getApprovedSellerAccount(shopIdRaw);
  const normalizedStatus = normalizeSellerAccountStatus(nextStatus);
  const currentStatus = normalizeSellerAccountStatus(sellerAccount.status);

  if (currentStatus === normalizedStatus) {
    return {
      shopId,
      status: currentStatus,
      sellerAccount: toSellerAccountPublic(sellerAccount),
    };
  }

  sellerAccount.status = normalizedStatus;
  await sellerAccount.save();

  return {
    shopId,
    status: sellerAccount.status,
    sellerAccount: toSellerAccountPublic(sellerAccount),
  };
}

async function pauseSeller(shopIdRaw) {
  const { shopId } = await getApprovedSellerAccount(shopIdRaw);
  const statusResult = await setSellerAccountStatus(shopIdRaw, SELLER_ACCOUNT_STATUSES.PAUSED);
  const productsResult = await pauseProductsForSeller(shopId);

  return {
    ...statusResult,
    products: productsResult,
  };
}

async function activateSeller(shopIdRaw) {
  const { shopId } = await getApprovedSellerAccount(shopIdRaw);
  const statusResult = await setSellerAccountStatus(shopIdRaw, SELLER_ACCOUNT_STATUSES.ACTIVE);
  const productsResult = await activateProductsForSeller(shopId);

  return {
    ...statusResult,
    products: productsResult,
  };
}

async function deleteSeller(shopIdRaw) {
  return deleteSellerCompletely(shopIdRaw);
}

module.exports = {
  pauseSeller,
  activateSeller,
  deleteSeller,
};
