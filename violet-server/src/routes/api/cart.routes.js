const express = require("express");
const cartController = require("../../controllers/cart/cartController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/cart", authMiddleware, cartController.getMyCart);
router.post("/cart/add", authMiddleware, cartController.addItem);
router.post("/cart/checkout", authMiddleware, cartController.checkout);
router.put(
  "/cart/delivery-address",
  authMiddleware,
  cartController.saveDeliveryAddress,
);
router.patch("/cart/items/:itemId", authMiddleware, cartController.updateQuantity);
router.post("/cart/items/:itemId/urgency-dismiss", authMiddleware, cartController.dismissUrgency);
router.delete("/cart/items/:itemId", authMiddleware, cartController.removeItem);
router.delete("/cart", authMiddleware, cartController.clearCart);

module.exports = router;
