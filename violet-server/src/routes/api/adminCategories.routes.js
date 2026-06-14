const express = require("express");
const controller = require("../../controllers/adminCategoriesController");

const router = express.Router();

router.get("/admin/categories", controller.list);

router.post("/admin/categories/countries", controller.createCountry);
router.patch("/admin/categories/countries/:countryId", controller.updateCountry);
router.delete("/admin/categories/countries/:countryId", controller.removeCountry);

router.post("/admin/categories/brands", controller.createBrand);
router.patch("/admin/categories/brands/:brandId", controller.updateBrand);
router.delete("/admin/categories/brands/:brandId", controller.removeBrand);

router.post("/admin/categories/filter-values", controller.createFilterValue);
router.patch("/admin/categories/filter-values/:filterId", controller.updateFilterValue);
router.delete("/admin/categories/filter-values/:filterId", controller.removeFilterValue);

module.exports = router;
