const express = require("express");
const controller = require("../../controllers/adminProductTypeController");

const router = express.Router();

router.get("/admin/product-types", controller.list);
router.post("/admin/product-types", controller.create);
router.patch("/admin/product-types/:productTypeId", controller.update);
router.delete("/admin/product-types/:productTypeId", controller.remove);

module.exports = router;
