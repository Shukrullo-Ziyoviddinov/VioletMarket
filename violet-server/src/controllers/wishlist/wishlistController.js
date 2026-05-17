const wishlistService = require("../../services/wishlist/wishlistService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getMyWishlist = asyncHandler(async (req, res) => {
  const data = await wishlistService.getWishlistForUser(req.userId);
  res.json({ ok: true, ...data });
});

const toggle = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  const result = await wishlistService.toggleWishlistItem(req.userId, productId);
  const data = await wishlistService.getWishlistForUser(req.userId);
  res.json({ ok: true, ...result, ...data });
});

const remove = asyncHandler(async (req, res) => {
  await wishlistService.removeWishlistItem(req.userId, req.params.productId);
  const data = await wishlistService.getWishlistForUser(req.userId);
  res.json({ ok: true, ...data });
});

module.exports = {
  getMyWishlist,
  toggle,
  remove,
};
