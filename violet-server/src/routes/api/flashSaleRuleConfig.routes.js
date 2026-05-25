const express = require("express");
const controller = require("../../controllers/flashSaleRuleConfigController");

const router = express.Router();

router.get("/flash-sale-rules", controller.getConfig);
router.patch("/flash-sale-rules", controller.updateConfig);

module.exports = router;
