const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/footer", siteDataController.footer);

module.exports = router;
