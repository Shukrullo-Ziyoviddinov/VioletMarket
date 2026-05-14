const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/categories", siteDataController.categories);

module.exports = router;
