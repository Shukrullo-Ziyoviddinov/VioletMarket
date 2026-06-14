const express = require("express");
const controller = require("../../controllers/adminUzbProductDeliveryInfoController");

const router = express.Router();

router.get("/admin/uzb-product-delivery-info", controller.get);
router.patch("/admin/uzb-product-delivery-info", controller.upsert);
router.delete("/admin/uzb-product-delivery-info", controller.remove);

module.exports = router;
