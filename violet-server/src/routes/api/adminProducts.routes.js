const express = require("express");
const controller = require("../../controllers/adminProductController");
const approvalController = require("../../controllers/adminProductApprovalController");

const router = express.Router();

router.get("/admin/products/stats", controller.stats);
router.get("/admin/products/picker", controller.picker);
router.get("/admin/products/pending", approvalController.listPending);
router.post("/admin/products/:id/approve", approvalController.approve);
router.post("/admin/products/:id/reject", approvalController.reject);
router.get("/admin/products/:id", controller.getById);
router.patch("/admin/products/:id", controller.update);
router.patch("/admin/products/:id/client-active", controller.setClientActive);
router.delete("/admin/products/:id", controller.remove);
router.get("/admin/products", controller.list);

module.exports = router;
