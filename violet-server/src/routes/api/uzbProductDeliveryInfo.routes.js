const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();

router.get("/uzb-product-delivery-info", siteDataController.uzbProductDeliveryInfo);

module.exports = router;
