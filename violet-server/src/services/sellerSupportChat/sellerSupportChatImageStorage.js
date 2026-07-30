const fs = require("fs");
const path = require("path");
const { HttpError } = require("../../utils/httpError");

const uploadRoot = path.resolve(__dirname, "../../../public/uploads");
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const JPEG_BASE64_PREFIX = /^data:image\/jpeg;base64,/i;

function ensureUploadRoot() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
}

function parseJpegBase64(imageBase64) {
  const raw = String(imageBase64 || "").trim();
  if (!raw) {
    throw new HttpError(400, "Rasm yuborilmadi", "VALIDATION_ERROR");
  }
  if (!JPEG_BASE64_PREFIX.test(raw)) {
    throw new HttpError(
      400,
      "Faqat JPEG formatdagi rasm qabul qilinadi",
      "VALIDATION_ERROR",
    );
  }

  const base64Data = raw.replace(JPEG_BASE64_PREFIX, "");
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
    throw new HttpError(
      400,
      "Rasm juda katta (maks. 1.5MB)",
      "VALIDATION_ERROR",
    );
  }

  if (!(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new HttpError(
      400,
      "Faqat haqiqiy JPEG rasm yuklash mumkin",
      "VALIDATION_ERROR",
    );
  }

  return buffer;
}

function createSellerSupportChatImageFilename() {
  const random = Math.random().toString(36).slice(2, 8);
  return `seller-support-chat-${Date.now()}-${random}.jpg`;
}

function saveSellerSupportChatImage(imageBase64) {
  ensureUploadRoot();
  const buffer = parseJpegBase64(imageBase64);
  const filename = createSellerSupportChatImageFilename();
  const absolutePath = path.join(uploadRoot, filename);

  try {
    fs.writeFileSync(absolutePath, buffer);
  } catch {
    throw new HttpError(500, "Rasmni saqlab bo‘lmadi", "UPLOAD_ERROR");
  }

  return {
    absolutePath,
    publicPath: `/uploads/${filename}`,
    filename,
  };
}

function isManagedSellerSupportChatImage(publicPath) {
  const value = String(publicPath || "").trim();
  if (!value.startsWith("/uploads/")) return false;
  const filename = path.basename(value);
  return /^seller-support-chat-\d+-[a-z0-9]+\.jpe?g$/i.test(filename);
}

function deleteManagedSellerSupportChatImage(publicPath) {
  if (!isManagedSellerSupportChatImage(publicPath)) return;
  const filename = path.basename(String(publicPath));
  const absolutePath = path.join(uploadRoot, filename);
  if (!absolutePath.startsWith(uploadRoot)) return;
  if (!fs.existsSync(absolutePath)) return;
  try {
    fs.unlinkSync(absolutePath);
  } catch {
    // ignore
  }
}

module.exports = {
  saveSellerSupportChatImage,
  deleteManagedSellerSupportChatImage,
  isManagedSellerSupportChatImage,
};
