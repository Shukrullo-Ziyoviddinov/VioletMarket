const express = require("express");
const controller = require("../../controllers/adminVideoBannerController");

const router = express.Router();

router.get("/admin/video-banners", controller.list);
router.post("/admin/video-banners", controller.create);
router.patch("/admin/video-banners/:bannerId", controller.update);
router.delete("/admin/video-banners/:bannerId", controller.remove);

module.exports = router;
