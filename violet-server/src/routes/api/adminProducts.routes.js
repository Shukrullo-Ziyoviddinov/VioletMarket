const express = require("express");
const controller = require("../../controllers/adminProductController");

const router = express.Router();

router.get("/admin/products/stats", controller.stats);
router.get("/admin/products", controller.list);

module.exports = router;
