const express = require("express");
const controller = require("../../controllers/logisticaAuthController");
const {
  logisticaAuthMiddleware,
} = require("../../middleware/logisticaAuthMiddleware");

const router = express.Router();

router.post(
  "/logistica-auth/register/send-code",
  controller.sendRegistrationCode,
);
router.post(
  "/logistica-auth/register/verify",
  controller.completeRegistration,
);
router.post("/logistica-auth/login/send-code", controller.sendLoginCode);
router.post("/logistica-auth/login/verify", controller.verifyLogin);
router.post(
  "/logistica-auth/approval-status",
  controller.getApprovalStatus,
);
router.get(
  "/logistica-auth/me",
  logisticaAuthMiddleware,
  controller.getProfile,
);
router.patch(
  "/logistica-auth/me/details",
  logisticaAuthMiddleware,
  controller.updateProfileDetails,
);

module.exports = router;
