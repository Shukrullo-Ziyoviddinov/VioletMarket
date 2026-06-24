const express = require("express");
const controller = require("../../controllers/sellerAuthController");
const sellerUploadController = require("../../controllers/sellerUploadController");
const { sellerAuthMiddleware } = require("../../middleware/sellerAuthMiddleware");

const router = express.Router();

function sellerImageUploadGuard(req, res, next) {
  sellerUploadController.uploadSingleImageMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || "Rasm yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

router.post("/seller-auth/register/start", controller.startRegistration);
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

module.exports = router;
