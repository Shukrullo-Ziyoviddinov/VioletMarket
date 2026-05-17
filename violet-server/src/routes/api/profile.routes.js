const express = require("express");
const profileController = require("../../controllers/profile/profileController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/auth/register", profileController.register);
router.get("/profile/me", authMiddleware, profileController.getMe);
router.patch("/profile/me", authMiddleware, profileController.updateMe);

module.exports = router;
