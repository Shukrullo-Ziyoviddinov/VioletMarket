const authConfig = require("../config/auth");

function trimUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getApiPublicBaseUrl() {
  const renderUrl = trimUrl(process.env.RENDER_EXTERNAL_URL);
  if (renderUrl) return renderUrl;

  const apiPublicUrl = trimUrl(process.env.API_PUBLIC_URL);
  if (apiPublicUrl) return apiPublicUrl;

  const port = process.env.PORT || "3001";
  return `http://localhost:${port}`;
}

function getStorefrontBaseUrl() {
  if (authConfig.publicSiteUrl) return authConfig.publicSiteUrl;

  const storefrontUrl = trimUrl(process.env.STOREFRONT_URL);
  if (storefrontUrl) return storefrontUrl;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return "";
}

function normalizeRelativePath(rawPath) {
  const normalizedSlashes = String(rawPath).trim().replace(/\\/g, "/");
  if (!normalizedSlashes) return "";
  return normalizedSlashes.startsWith("/") ? normalizedSlashes : `/${normalizedSlashes}`;
}

function resolvePublicAssetUrl(pathValue) {
  if (!pathValue) return "";

  const rawPath = String(pathValue).trim();
  if (!rawPath) return "";

  if (rawPath.startsWith("data:")) return rawPath;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const normalizedSlashes = rawPath.replace(/\\/g, "/");

  const isUploadPath =
    normalizedSlashes.startsWith("/uploads/") ||
    normalizedSlashes.startsWith("uploads/") ||
    normalizedSlashes.includes("/uploads/");

  if (isUploadPath) {
    const uploadStartIndex = normalizedSlashes.indexOf("/uploads/");
    const uploadRelative =
      uploadStartIndex >= 0
        ? normalizedSlashes.slice(uploadStartIndex)
        : `/${normalizedSlashes.replace(/^\/?uploads\//, "uploads/")}`;
    const normalizedUploadPath = normalizeRelativePath(uploadRelative);
    return `${getApiPublicBaseUrl()}${normalizedUploadPath}`;
  }

  if (/^(admin-|seller-|upload-|image-).+\.[a-z0-9]+$/i.test(normalizedSlashes)) {
    return `${getApiPublicBaseUrl()}/uploads/${normalizedSlashes}`;
  }

  const storefrontBase = getStorefrontBaseUrl();
  const relativePath = normalizeRelativePath(normalizedSlashes);

  if (storefrontBase) {
    return `${storefrontBase}${relativePath}`;
  }

  return relativePath;
}

module.exports = {
  getApiPublicBaseUrl,
  getStorefrontBaseUrl,
  resolvePublicAssetUrl,
};
