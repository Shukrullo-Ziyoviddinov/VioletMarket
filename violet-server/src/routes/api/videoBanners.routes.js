const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/video-banners", siteDataController.videoBanner);

module.exports = router;
