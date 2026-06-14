const express = require("express");
const controller = require("../../controllers/adminUzWarehouseController");

const router = express.Router();

router.get("/admin/uz-warehouse", controller.get);
router.patch("/admin/uz-warehouse", controller.upsert);
router.delete("/admin/uz-warehouse/:slotKey", controller.remove);

module.exports = router;
