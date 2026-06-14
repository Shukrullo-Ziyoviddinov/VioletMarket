const express = require("express");
const controller = require("../../controllers/adminFooterController");

const router = express.Router();

router.get("/admin/footer", controller.list);

router.post("/admin/footer/about-sections", controller.createAboutSection);
router.patch("/admin/footer/about-sections/:sectionId", controller.updateAboutSection);
router.delete("/admin/footer/about-sections/:sectionId", controller.removeAboutSection);

router.post("/admin/footer/social-media", controller.createSocial);
router.patch("/admin/footer/social-media/:socialId", controller.updateSocial);
router.delete("/admin/footer/social-media/:socialId", controller.removeSocial);

router.post("/admin/footer/app-stores", controller.createAppStore);
router.patch("/admin/footer/app-stores/:appStoreId", controller.updateAppStore);
router.delete("/admin/footer/app-stores/:appStoreId", controller.removeAppStore);

router.post("/admin/footer/contacts", controller.createContact);
router.patch("/admin/footer/contacts/:contactId", controller.updateContact);
router.delete("/admin/footer/contacts/:contactId", controller.removeContact);

module.exports = router;
