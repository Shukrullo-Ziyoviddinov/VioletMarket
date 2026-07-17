const express = require("express");
const controller = require("../../controllers/deliveryAuthController");
const {
  deliveryAuthMiddleware,
} = require("../../middleware/deliveryAuthMiddleware");
const {
  deliveryPhotoUploadMiddleware,
} = require("../../middleware/deliveryPhotoUpload");

const router = express.Router();

router.post("/delivery-auth/email/start", controller.startEmailAuth);
router.post(
  "/delivery-auth/register/send-code",
  controller.sendRegistrationCode,
);
router.post("/delivery-auth/login/verify", controller.verifyLogin);
router.post(
  "/delivery-auth/register/verify",
  deliveryPhotoUploadMiddleware,
  controller.completeRegistration,
);
router.get(
  "/delivery-auth/me",
  deliveryAuthMiddleware,
  controller.getProfile,
);

module.exports = router;
