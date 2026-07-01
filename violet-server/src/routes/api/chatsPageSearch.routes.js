const express = require("express");
const chatsPageSearchController = require("../../controllers/chatsPageSearchController");

const router = express.Router();
router.get("/chats-page/seller-search", chatsPageSearchController.searchSellers);

module.exports = router;
