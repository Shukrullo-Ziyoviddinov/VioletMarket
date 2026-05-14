const express = require("express");
const productController = require("../../controllers/productController");

const router = express.Router();

router.get("/products", productController.list);
router.get("/products/:id", productController.getById);

module.exports = router;
