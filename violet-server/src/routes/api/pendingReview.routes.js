const express = require("express");
const pendingReviewController = require("../../controllers/pendingReview/pendingReviewController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/pending-reviews", authMiddleware, pendingReviewController.listMine);
router.post("/pending-reviews", authMiddleware, pendingReviewController.createBatch);

module.exports = router;
