const path = require("path");
const fs = require("fs");
const multer = require("multer");

// index.js dagi static yo'l bilan bir xil bo'lishi kerak: <projectRoot>/public/uploads
const uploadRoot = path.resolve(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".png";
    const random = Math.random().toString(36).slice(2, 8);
    cb(null, `admin-${Date.now()}-${random}${safeExt}`);
  },
});

function imageFileFilter(_req, file, cb) {
  if (!file || !file.mimetype || !file.mimetype.startsWith("image/")) {
    cb(new Error("Faqat image fayl yuklash mumkin"));
    return;
  }
  cb(null, true);
}

const uploadSingleImageMiddleware = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

function uploadImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "Image fayl topilmadi",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  res.status(201).json({
    ok: true,
    data: {
      path: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
}

module.exports = {
  uploadSingleImageMiddleware,
  uploadImage,
};
