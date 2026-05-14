const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/uz-warehouse", siteDataController.uzWarehouse);

module.exports = router;
