/**
 * Seller cabinet API routes — URL lar o‘zgarmagan (/seller-auth/...).
 *
 *   auth.routes.js          register / login / me / profile / uploads
 *   orders.routes.js        buyurtma zanjiri + cargo
 *   returned.routes.js      qaytarilgan + returned stats
 *   noAnswer.routes.js      javob bermadi yechimlari
 *   stats.routes.js         sales / earnings / withdrawals
 *   products.routes.js      mahsulot CRUD
 *   notifications.routes.js
 *   messageChat.routes.js
 */
const express = require("express");

const router = express.Router();

router.use(require("./auth.routes"));
router.use(require("./noAnswer.routes"));
router.use(require("./orders.routes"));
router.use(require("./returned.routes"));
router.use(require("./stats.routes"));
router.use(require("./products.routes"));
router.use(require("./notifications.routes"));
router.use(require("./messageChat.routes"));

module.exports = router;
