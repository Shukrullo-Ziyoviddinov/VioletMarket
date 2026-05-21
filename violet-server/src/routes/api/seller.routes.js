const express = require("express");
const sellerController = require("../../controllers/seller/sellerController");
const { optionalAuthMiddleware } = require("../../middleware/optionalAuthMiddleware");

const router = express.Router();

/** Umumiy /sellers/:sellerId dan oldin ulangan bo‘lishi kerak */
router.get(
  "/sellers/:sellerId/profile",
  optionalAuthMiddleware,
  sellerController.getProfile,
);
router.get("/sellers/:sellerId/products", sellerController.getProducts);
router.get("/sellers/:sellerId/rating-summary", sellerController.getRatingSummary);

module.exports = router;
