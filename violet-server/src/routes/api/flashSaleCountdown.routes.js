const express = require("express");
const flashSaleCountdownController = require("../../controllers/flashSaleCountdown/flashSaleCountdownController");

const router = express.Router();

router.get(
  "/flash-sale/:productId",
  flashSaleCountdownController.getForProduct,
);

router.post("/flash-sale/batch", flashSaleCountdownController.syncBatch);

module.exports = router;
