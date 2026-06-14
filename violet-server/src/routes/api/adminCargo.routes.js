const express = require("express");
const controller = require("../../controllers/adminCargoController");

const router = express.Router();

router.get("/admin/cargo", controller.list);

router.post("/admin/cargo/cargo-rates", controller.createCargoRate);
router.patch("/admin/cargo/cargo-rates/:key", controller.updateCargoRate);
router.delete("/admin/cargo/cargo-rates/:key", controller.removeCargoRate);

router.post("/admin/cargo/delivery-prices", controller.createDeliveryPrice);
router.patch("/admin/cargo/delivery-prices/:key", controller.updateDeliveryPrice);
router.delete("/admin/cargo/delivery-prices/:key", controller.removeDeliveryPrice);

module.exports = router;
