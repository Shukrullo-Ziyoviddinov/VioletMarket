const express = require("express");
const controller = require("../../controllers/sellerAuthController");
const sellerProductController = require("../../controllers/sellerProductController");
const sellerUploadController = require("../../controllers/sellerUploadController");
const { sellerAuthMiddleware } = require("../../middleware/sellerAuthMiddleware");
const sellerMessageChatController = require("../../controllers/messageChat/sellerMessageChatController");
const sellerSalesStatisticsController = require("../../controllers/sellerSalesStatisticsController");

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

function sellerVideoUploadGuard(req, res, next) {
  sellerUploadController.uploadSingleVideoMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || "Video yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

router.post("/seller-auth/register/start", controller.startRegistration);
router.get("/seller-auth/register/countries", controller.getSellerCountryOptions);
router.post("/seller-auth/register/verify-email", controller.verifyRegistrationEmail);
router.post("/seller-auth/register/submit-application", controller.submitApplication);
router.get("/seller-auth/application-status", controller.getApplicationStatus);
router.post("/seller-auth/login", controller.loginSeller);
router.get("/seller-auth/me", sellerAuthMiddleware, controller.getCabinetProfile);
router.get(
  "/seller-auth/sales/statistics",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerSalesStatistics,
);
router.get(
  "/seller-auth/sales/revenue-chart",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerSalesRevenueChart,
);
router.get(
  "/seller-auth/product-form/options",
  sellerAuthMiddleware,
  sellerProductController.getProductFormOptions,
);
router.get(
  "/seller-auth/product-form/related-picker",
  sellerAuthMiddleware,
  sellerProductController.getRelatedProductPickerOptions,
);
router.get("/seller-auth/products", sellerAuthMiddleware, sellerProductController.listSellerProducts);
router.post("/seller-auth/products", sellerAuthMiddleware, sellerProductController.createSellerProduct);
router.get(
  "/seller-auth/products/:productId",
  sellerAuthMiddleware,
  sellerProductController.getSellerProduct,
);
router.patch(
  "/seller-auth/products/:productId",
  sellerAuthMiddleware,
  sellerProductController.updateSellerProduct,
);
router.delete(
  "/seller-auth/products/:productId",
  sellerAuthMiddleware,
  sellerProductController.deleteSellerProduct,
);
router.patch(
  "/seller-auth/products/:productId/client-active",
  sellerAuthMiddleware,
  sellerProductController.setSellerProductClientActive,
);
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
router.get(
  "/seller-auth/message-chat/threads",
  sellerAuthMiddleware,
  sellerMessageChatController.listSellerThreads,
);
router.get(
  "/seller-auth/message-chat/threads/:userId/messages",
  sellerAuthMiddleware,
  sellerMessageChatController.getSellerThreadMessages,
);
router.post(
  "/seller-auth/message-chat/threads/:userId/messages",
  sellerAuthMiddleware,
  sellerMessageChatController.sendSellerMessage,
);
router.post(
  "/seller-auth/message-chat/threads/:userId/read",
  sellerAuthMiddleware,
  sellerMessageChatController.markSellerThreadRead,
);
router.patch(
  "/seller-auth/message-chat/threads/:userId/messages/:messageId",
  sellerAuthMiddleware,
  sellerMessageChatController.editSellerMessage,
);
router.delete(
  "/seller-auth/message-chat/threads/:userId",
  sellerAuthMiddleware,
  sellerMessageChatController.deleteSellerThread,
);
router.delete(
  "/seller-auth/message-chat/threads/:userId/messages/:messageId",
  sellerAuthMiddleware,
  sellerMessageChatController.deleteSellerMessage,
);

module.exports = router;
