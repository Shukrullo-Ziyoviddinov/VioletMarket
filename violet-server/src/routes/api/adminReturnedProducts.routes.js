const express = require("express");
const controller = require("../../controllers/adminReturnedProductsController");

const router = express.Router();

router.get("/admin/returned-products", controller.listReturnedProducts);

module.exports = router;
