const express = require("express");
const controller = require("../../controllers/adminHomeBannerController");

const router = express.Router();

router.get("/admin/home-banners", controller.list);
router.post("/admin/home-banners", controller.create);
router.patch("/admin/home-banners/:bannerId", controller.update);
router.delete("/admin/home-banners/:bannerId", controller.remove);

module.exports = router;
