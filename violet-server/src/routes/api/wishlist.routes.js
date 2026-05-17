const express = require("express");
const wishlistController = require("../../controllers/wishlist/wishlistController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/wishlist", authMiddleware, wishlistController.getMyWishlist);
router.post("/wishlist/toggle", authMiddleware, wishlistController.toggle);
router.delete("/wishlist/:productId", authMiddleware, wishlistController.remove);

module.exports = router;
