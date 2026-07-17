const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { HttpError } = require("../../utils/httpError");

const uploadDir = path.resolve(
  __dirname,
  "../../../public/uploads/delivery",
);
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const mimeConfig = {
  "image/jpeg": {
    extension: ".jpg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  "image/webp": {
    extension: ".webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
};

async function saveDeliveryPhotoBase64(rawBase64, rawMimeType) {
  const mimeType = String(rawMimeType || "").trim().toLowerCase();
  const config = mimeConfig[mimeType];
  if (!config) {
    throw new HttpError(
      400,
      "Profil rasmi JPG, PNG yoki WEBP bo'lishi kerak",
      "PHOTO_TYPE_INVALID",
    );
  }

  const base64 = String(rawBase64 || "")
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s+/g, "");
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new HttpError(400, "Profil rasmi noto'g'ri", "PHOTO_INVALID");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length < 100 || buffer.length > MAX_PHOTO_BYTES) {
    throw new HttpError(
      400,
      "Profil rasmi hajmi 2 MB dan oshmasligi kerak",
      "PHOTO_SIZE_INVALID",
    );
  }
  if (!config.matches(buffer)) {
    throw new HttpError(400, "Profil rasmi formati noto'g'ri", "PHOTO_INVALID");
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `profile-${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}${config.extension}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return { filename, path: filePath };
}

module.exports = { saveDeliveryPhotoBase64 };
