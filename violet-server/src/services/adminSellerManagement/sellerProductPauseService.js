const { Product } = require("../../models/product");
const { CLIENT_ACTIVE_FILTER } = require("../../utils/productClientVisibility");

async function pauseProductsForSeller(shopId) {
  const result = await Product.updateMany(
    {
      sellerId: shopId,
      ...CLIENT_ACTIVE_FILTER,
    },
    {
      $set: {
        clientActive: false,
        pausedBySeller: true,
      },
    },
  );

  return {
    pausedCount: result.modifiedCount,
  };
}

async function activateProductsForSeller(shopId) {
  const result = await Product.updateMany(
    {
      sellerId: shopId,
      pausedBySeller: true,
    },
    {
      $set: {
        clientActive: true,
        pausedBySeller: false,
      },
    },
  );

  return {
    reactivatedCount: result.modifiedCount,
  };
}

module.exports = {
  pauseProductsForSeller,
  activateProductsForSeller,
};
