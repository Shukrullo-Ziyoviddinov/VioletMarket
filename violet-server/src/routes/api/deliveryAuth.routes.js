const express = require("express");
const controller = require("../../controllers/deliveryAuthController");
const {
  deliveryAuthMiddleware,
} = require("../../middleware/deliveryAuthMiddleware");

const router = express.Router();

router.post("/delivery-auth/email/start", controller.startEmailAuth);
router.post(
  "/delivery-auth/register/send-code",
  controller.sendRegistrationCode,
);
router.post("/delivery-auth/login/verify", controller.verifyLogin);
router.post("/delivery-auth/register/verify", controller.completeRegistration);
router.post(
  "/delivery-auth/approval-status",
  controller.getApprovalStatus,
);
router.get(
  "/delivery-auth/me",
  deliveryAuthMiddleware,
  controller.getProfile,
);
router.patch(
  "/delivery-auth/me",
  deliveryAuthMiddleware,
  controller.updateProfile,
);
router.post(
  "/delivery-auth/me/photo",
  deliveryAuthMiddleware,
  controller.updateProfilePhoto,
);
router.patch(
  "/delivery-auth/me/transport",
  deliveryAuthMiddleware,
  controller.updateTransport,
);

module.exports = router;
