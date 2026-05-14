const express = require("express");
const siteDataController = require("../../controllers/siteDataController");

const router = express.Router();
router.get("/cargo", siteDataController.cargo);

module.exports = router;
