const { normalizeSellerAccountStatus } = require("../../utils/sellerAccountStatus");

function toSellerAccountPublic(account) {
  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    sellerCountry: account.sellerCountry || "",
    logo: account.logo,
    subscriberCount: account.subscriberCount,
    orderCount: Math.max(0, Number(account.orderCount) || 0),
    status: normalizeSellerAccountStatus(account.status),
  };
}

module.exports = { toSellerAccountPublic };
