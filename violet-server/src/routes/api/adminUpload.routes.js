const express = require("express");
const controller = require("../../controllers/adminUploadController");

const router = express.Router();

function uploadGuard(req, res, next) {
  controller.uploadSingleImageMiddleware(req, res, (err) => {
    if (err) {
      res.status(400).json({
        ok: false,
        message: err.message || "Upload xatosi",
        code: "UPLOAD_ERROR",
      });
      return;
    }
    next();
  });
}

router.post(
  "/admin/uploads/image",
  uploadGuard,
  controller.uploadImage,
);

module.exports = router;
