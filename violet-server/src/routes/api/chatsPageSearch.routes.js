const express = require("express");
const chatsPageSearchController = require("../../controllers/chatsPageSearchController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/chats-page/seller-search", chatsPageSearchController.searchSellers);
router.get("/chats-page/search-history", authMiddleware, chatsPageSearchController.getSearchHistory);
router.post("/chats-page/search-history", authMiddleware, chatsPageSearchController.addSellerToHistory);
router.delete(
  "/chats-page/search-history/:sellerId",
  authMiddleware,
  chatsPageSearchController.removeSellerFromHistory,
);

module.exports = router;
