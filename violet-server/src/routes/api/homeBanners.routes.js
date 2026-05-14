const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/home-banners", siteDataController.homeBanner);

module.exports = router;
