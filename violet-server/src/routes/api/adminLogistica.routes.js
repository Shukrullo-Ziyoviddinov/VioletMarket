const express = require("express");
const controller = require("../../controllers/adminLogisticaController");

const router = express.Router();

router.get("/admin/logistica", controller.listLogistica);
router.get("/admin/logistica/:id/detail", controller.getLogisticaDetail);
router.get(
  "/admin/logistica/:id/history",
  controller.listLogisticaDetailHistory,
);
router.post("/admin/logistica/:id/approve", controller.approveLogistica);
router.post("/admin/logistica/:id/reject", controller.rejectLogistica);
router.delete("/admin/logistica/:id", controller.deleteLogistica);

module.exports = router;
