const express = require("express");
const controller = require("../../../controllers/sellerAuthController");
const sellerUploadController = require("../../../controllers/sellerUploadController");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const {
  sellerImageUploadGuard,
  sellerVideoUploadGuard,
} = require("./uploadGuards");

const router = express.Router();

router.post("/seller-auth/register/start", controller.startRegistration);
router.get("/seller-auth/register/countries", controller.getSellerCountryOptions);
router.post("/seller-auth/register/verify-email", controller.verifyRegistrationEmail);
router.post("/seller-auth/register/submit-application", controller.submitApplication);
router.get("/seller-auth/application-status", controller.getApplicationStatus);
router.post("/seller-auth/login", controller.loginSeller);
router.get("/seller-auth/me", sellerAuthMiddleware, controller.getCabinetProfile);
router.patch("/seller-auth/market-profile", sellerAuthMiddleware, controller.updateMarketProfile);
router.post(
  "/seller-auth/uploads/image",
  sellerAuthMiddleware,
  sellerImageUploadGuard,
  sellerUploadController.uploadSellerImage,
);
router.post(
  "/seller-auth/uploads/video",
  sellerAuthMiddleware,
  sellerVideoUploadGuard,
  sellerUploadController.uploadSellerVideo,
);

module.exports = router;
