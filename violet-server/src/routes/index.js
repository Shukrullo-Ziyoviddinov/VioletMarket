const express = require("express");
const healthController = require("../controllers/healthController");
const apiRouter = require("./api");

const router = express.Router();

router.get("/", healthController.root);
router.use("/api", apiRouter);

module.exports = router;
