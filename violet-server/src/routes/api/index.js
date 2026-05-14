const express = require("express");
const productsRoutes = require("./products.routes");
const categoriesRoutes = require("./categories.routes");
const navbarRoutes = require("./navbar.routes");
const homeBannersRoutes = require("./homeBanners.routes");
const footerRoutes = require("./footer.routes");
const cargoRoutes = require("./cargo.routes");
const videoBannersRoutes = require("./videoBanners.routes");
const sellersRoutes = require("./sellers.routes");
const defaultProductPolicyRoutes = require("./defaultProductPolicy.routes");
const uzWarehouseRoutes = require("./uzWarehouse.routes");

const router = express.Router();

router.use(productsRoutes);
router.use(categoriesRoutes);
router.use(navbarRoutes);
router.use(homeBannersRoutes);
router.use(footerRoutes);
router.use(cargoRoutes);
router.use(videoBannersRoutes);
router.use(sellersRoutes);
router.use(defaultProductPolicyRoutes);
router.use(uzWarehouseRoutes);

module.exports = router;
