const express = require("express");
const recommendationController = require("../../controllers/recommendation/recommendationController");
const tavsiyaEtamizController = require("../../controllers/tavsiyaEtamiz/tavsiyaEtamizController");
const { optionalAuthMiddleware } = require("../../middleware/optionalAuthMiddleware");

const router = express.Router();

router.get(
  "/recommendations/related/:productId",
  recommendationController.related,
);

router.get(
  "/recommendations/for-product/:productId",
  optionalAuthMiddleware,
  tavsiyaEtamizController.forProductDetail,
);

router.get(
  "/recommendations/by-history",
  optionalAuthMiddleware,
  tavsiyaEtamizController.byHistory,
);

module.exports = router;
