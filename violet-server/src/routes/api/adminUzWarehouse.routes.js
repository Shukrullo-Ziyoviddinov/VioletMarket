const express = require("express");
const controller = require("../../controllers/adminUzWarehouseController");

const router = express.Router();

router.get("/admin/uz-warehouse", controller.get);
router.patch("/admin/uz-warehouse", controller.upsert);

module.exports = router;
