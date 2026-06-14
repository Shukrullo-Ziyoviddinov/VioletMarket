const express = require("express");
const controller = require("../../controllers/adminShippingCountryController");

const router = express.Router();

router.get("/admin/shipping-countries", controller.list);
router.post("/admin/shipping-countries", controller.create);
router.patch("/admin/shipping-countries/:shippingCountryId", controller.update);
router.delete("/admin/shipping-countries/:shippingCountryId", controller.remove);

module.exports = router;
