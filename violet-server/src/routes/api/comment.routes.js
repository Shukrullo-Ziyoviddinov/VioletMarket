const express = require("express");
const commentController = require("../../controllers/comment/commentController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/products/:productId/comments", commentController.listByProduct);
router.post("/comments", authMiddleware, commentController.create);

module.exports = router;
