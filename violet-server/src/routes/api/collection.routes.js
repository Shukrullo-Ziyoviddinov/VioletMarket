const express = require("express");
const collectionController = require("../../controllers/collection/collectionController");

const router = express.Router();

router.get(
  "/collections/:categoryName/products",
  collectionController.getProducts,
);

module.exports = router;
