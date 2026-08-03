const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerProductController = require("../../../controllers/sellerProductController");

const router = express.Router();

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

module.exports = router;
