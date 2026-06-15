const express = require("express");
const controller = require("../../controllers/adminProductController");

const router = express.Router();

router.get("/admin/products/stats", controller.stats);
router.get("/admin/products/picker", controller.picker);
router.get("/admin/products/:id", controller.getById);
router.patch("/admin/products/:id", controller.update);
router.delete("/admin/products/:id", controller.remove);
router.get("/admin/products", controller.list);

module.exports = router;
