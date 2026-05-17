const express = require("express");
const viewedAtController = require("../../controllers/viewedAt/viewedAtController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/viewed-at", authMiddleware, viewedAtController.listMine);
router.post("/viewed-at", authMiddleware, viewedAtController.recordView);

module.exports = router;
