/**
 * Rang / o‘lcham / model yorlig‘ini stringga aylantirish.
 * Object bo‘lsa uz/ru/name; "[object Object]" ni rad etadi.
 */
function resolveOptionLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (!text || text === "[object Object]") return "";
    return text;
  }
  if (typeof value === "object") {
    const fromName = value.name ?? value.size ?? value.label ?? "";
    if (typeof fromName === "string" || typeof fromName === "number") {
      return String(fromName).trim();
    }
    if (fromName && typeof fromName === "object") {
      return String(fromName.uz || fromName.ru || "").trim();
    }
    return String(value.uz || value.ru || "").trim();
  }
  return "";
}

module.exports = { resolveOptionLabel };
