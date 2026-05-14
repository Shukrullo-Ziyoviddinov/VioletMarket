const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/sellers", siteDataController.sellers);
router.get("/sellers/:sellerId", siteDataController.sellerById);

module.exports = router;
