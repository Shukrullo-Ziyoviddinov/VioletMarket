const express = require("express");
const controller = require("../../controllers/adminNavbarController");

const router = express.Router();

router.get("/admin/navbar", controller.list);
router.post("/admin/navbar", controller.createSection);
router.patch("/admin/navbar/:sectionId", controller.updateSection);
router.delete("/admin/navbar/:sectionId", controller.deleteSection);

router.post("/admin/navbar/:sectionId/items", controller.createItem);
router.patch("/admin/navbar/:sectionId/items/:itemId", controller.updateItem);
router.delete("/admin/navbar/:sectionId/items/:itemId", controller.deleteItem);

module.exports = router;
