const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/navbar", siteDataController.navbar);

module.exports = router;
