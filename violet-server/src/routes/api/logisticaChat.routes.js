const express = require("express");
const { logisticaAuthMiddleware } = require("../../middleware/logisticaAuthMiddleware");
const logisticaChatLogisticaController = require("../../controllers/logisticaChat/logisticaChatLogisticaController");
const logisticaChatAdminController = require("../../controllers/logisticaChat/logisticaChatAdminController");

const router = express.Router();

router.get(
  "/logistica/chat/messages",
  logisticaAuthMiddleware,
  logisticaChatLogisticaController.listMessages,
);
router.get(
  "/logistica/chat/unread",
  logisticaAuthMiddleware,
  logisticaChatLogisticaController.getUnreadCount,
);
router.post(
  "/logistica/chat/messages",
  logisticaAuthMiddleware,
  logisticaChatLogisticaController.sendMessage,
);
router.post(
  "/logistica/chat/read",
  logisticaAuthMiddleware,
  logisticaChatLogisticaController.markRead,
);

router.get(
  "/admin/logistica-chat/threads",
  logisticaChatAdminController.listThreads,
);
router.get(
  "/admin/logistica-chat/threads/:logisticaId/messages",
  logisticaChatAdminController.listMessages,
);
router.post(
  "/admin/logistica-chat/threads/:logisticaId/messages",
  logisticaChatAdminController.sendMessage,
);
router.post(
  "/admin/logistica-chat/threads/:logisticaId/read",
  logisticaChatAdminController.markRead,
);

module.exports = router;
