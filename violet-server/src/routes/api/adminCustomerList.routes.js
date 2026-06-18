const express = require("express");
const controller = require("../../controllers/adminCustomerListController");

const router = express.Router();

router.get("/admin/customers/registered", controller.listRegisteredCustomers);

module.exports = router;
