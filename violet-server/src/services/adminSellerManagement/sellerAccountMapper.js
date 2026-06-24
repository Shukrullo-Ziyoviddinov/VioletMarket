const { normalizeSellerAccountStatus } = require("../../utils/sellerAccountStatus");

function toSellerAccountPublic(account) {
  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    logo: account.logo,
    subscriberCount: account.subscriberCount,
    status: normalizeSellerAccountStatus(account.status),
  };
}

module.exports = { toSellerAccountPublic };
