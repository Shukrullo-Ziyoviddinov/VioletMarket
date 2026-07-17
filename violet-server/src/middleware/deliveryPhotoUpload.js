const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const deliveryUploadDir = path.resolve(
  __dirname,
  "../../public/uploads/delivery",
);

if (!fs.existsSync(deliveryUploadDir)) {
  fs.mkdirSync(deliveryUploadDir, { recursive: true });
}

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, deliveryUploadDir),
  filename: (_req, file, callback) => {
    const extension = allowedMimeTypes.get(file.mimetype) || ".jpg";
    callback(
      null,
      `profile-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`,
    );
  },
});

const uploadDeliveryPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Faqat JPG, PNG yoki WEBP rasm yuborish mumkin"));
      return;
    }
    callback(null, true);
  },
}).single("photo");

function deliveryPhotoUploadMiddleware(req, res, next) {
  uploadDeliveryPhoto(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.message || "Profil rasmini yuklashda xatolik",
        code: "UPLOAD_ERROR",
      });
    }
    return next();
  });
}

module.exports = { deliveryPhotoUploadMiddleware, deliveryUploadDir };
