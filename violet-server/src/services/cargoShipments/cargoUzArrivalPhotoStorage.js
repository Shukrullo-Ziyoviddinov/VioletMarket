/**
 * Logistica UZB omboriga kelish — og‘irlik + cargo summa.
 * Clientga yuborish: processStep → toshkent_omborida.
 * Mijozga push/so‘rov — keyingi qadam.
 */

const fs = require("fs");
const path = require("path");
const { HttpError } = require("../../utils/httpError");

const uploadRoot = path.resolve(__dirname, "../../../public/uploads");
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const DATA_URL_PREFIX = /^data:image\/(jpeg|jpg|png);base64,/i;

function ensureUploadRoot() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
}

function parseOptionalArrivalPhoto(imageBase64) {
  const raw = String(imageBase64 || "").trim();
  if (!raw) return null;

  const match = raw.match(DATA_URL_PREFIX);
  if (!match) {
    throw new HttpError(
      400,
      "Faqat JPEG/PNG rasm qabul qilinadi",
      "VALIDATION_ERROR",
    );
  }

  const ext = String(match[1] || "jpeg").toLowerCase() === "png" ? "png" : "jpg";
  const base64Data = raw.replace(DATA_URL_PREFIX, "");
  let buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    throw new HttpError(400, "Rasm noto‘g‘ri", "VALIDATION_ERROR");
  }

  if (!buffer.length) {
    throw new HttpError(400, "Rasm bo‘sh", "VALIDATION_ERROR");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new HttpError(400, "Rasm juda katta (maks. 1.5MB)", "VALIDATION_ERROR");
  }

  ensureUploadRoot();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `cargo-uz-${Date.now()}-${random}.${ext}`;
  const absolutePath = path.join(uploadRoot, filename);
  try {
    fs.writeFileSync(absolutePath, buffer);
  } catch {
    throw new HttpError(500, "Rasmni saqlab bo‘lmadi", "UPLOAD_ERROR");
  }

  return `/uploads/${filename}`;
}

module.exports = {
  parseOptionalArrivalPhoto,
};
