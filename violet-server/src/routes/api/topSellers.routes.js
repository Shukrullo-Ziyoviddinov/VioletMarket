const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/top-sellers", siteDataController.topSillers);

module.exports = router;
