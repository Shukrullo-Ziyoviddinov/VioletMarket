const express = require("express");
const controller = require("../../controllers/adminProductPolicyController");

const router = express.Router();

router.get("/admin/product-policy", controller.list);
router.post("/admin/product-policy", controller.create);
router.patch("/admin/product-policy/:order", controller.update);
router.delete("/admin/product-policy/:order", controller.remove);

module.exports = router;
