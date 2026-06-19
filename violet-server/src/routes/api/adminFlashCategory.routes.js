const express = require("express");
const controller = require("../../controllers/adminFlashCategoryController");

const router = express.Router();

router.get("/admin/flash-category/options", controller.listCategoryOptions);
router.get("/admin/flash-category/sellers", controller.listSellers);
router.get("/admin/flash-category/sellers/:sellerId/products", controller.listSellerProducts);
router.get("/admin/flash-category/products", controller.listFlashProducts);
router.post("/admin/flash-category/assign", controller.assignFlashProduct);
router.patch("/admin/flash-category/products/:productId/remove", controller.removeFlashProduct);

module.exports = router;
