const sellerUploadController = require("../../../controllers/sellerUploadController");

function sellerImageUploadGuard(req, res, next) {
  sellerUploadController.uploadSingleImageMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || "Rasm yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

function sellerVideoUploadGuard(req, res, next) {
  sellerUploadController.uploadSingleVideoMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || "Video yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

module.exports = {
  sellerImageUploadGuard,
  sellerVideoUploadGuard,
};
