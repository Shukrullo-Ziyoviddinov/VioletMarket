const express = require("express");
const controller = require("../../controllers/sellerAuthController");
const { sellerAuthMiddleware } = require("../../middleware/sellerAuthMiddleware");

const router = express.Router();

router.post("/seller-auth/register/start", controller.startRegistration);
router.post("/seller-auth/register/verify-email", controller.verifyRegistrationEmail);
router.post("/seller-auth/register/submit-application", controller.submitApplication);
router.get("/seller-auth/application-status", controller.getApplicationStatus);
router.post("/seller-auth/login", controller.loginSeller);
router.get("/seller-auth/me", sellerAuthMiddleware, controller.getCabinetProfile);

module.exports = router;
