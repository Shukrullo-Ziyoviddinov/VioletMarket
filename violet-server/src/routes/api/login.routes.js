const express = require("express");
const authConfig = require("../../config/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const { resolveBrevoSender } = require("../../services/login/brevoSenderResolver");
const loginController = require("../../controllers/login/loginController");

const router = express.Router();

router.get(
  "/auth/health",
  asyncHandler(async (req, res) => {
    if (!authConfig.isBrevoConfigured()) {
      return res.json({
        ok: false,
        brevoConfigured: false,
        message: "BREVO_API_KEY .env da yo'q",
      });
    }
    try {
      const sender = await resolveBrevoSender();
      res.json({
        ok: true,
        brevoConfigured: true,
        senderEmail: sender.email,
        message: "Brevo tayyor, email yuborish mumkin",
      });
    } catch (err) {
      res.status(err.status || 503).json({
        ok: false,
        brevoConfigured: false,
        message: err.message,
        code: err.code,
      });
    }
  }),
);

router.post("/auth/send-login-code", loginController.sendLoginCode);
router.post("/auth/send-register-code", loginController.sendRegisterCode);
router.post("/auth/verify-login", loginController.verifyLoginCode);

module.exports = router;
