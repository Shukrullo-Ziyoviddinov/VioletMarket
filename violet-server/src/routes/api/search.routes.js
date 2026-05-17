const express = require("express");
const searchController = require("../../controllers/search/searchController");
const { authMiddleware } = require("../../middleware/authMiddleware");
const { optionalAuthMiddleware } = require("../../middleware/optionalAuthMiddleware");

const router = express.Router();

router.get("/search", optionalAuthMiddleware, searchController.search);
router.get("/search/suggestions", optionalAuthMiddleware, searchController.suggestions);
router.get("/search/recommended-default", searchController.recommendedDefault);

router.get("/search/history", authMiddleware, searchController.getHistory);
router.post("/search/history/query", authMiddleware, searchController.addQuery);
router.delete("/search/history/query", authMiddleware, searchController.removeQuery);
router.get("/search/recommended", authMiddleware, searchController.recommended);

module.exports = router;
