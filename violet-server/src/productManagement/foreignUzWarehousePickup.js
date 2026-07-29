/**
 * Xorij → UZB: asosiy admin kiritadigan ombor pickup manzili.
 * UZB siller address zanjiriga aralashmaydi.
 *
 * Matn majburiy; coords ixtiyoriy [lat, lng].
 */

const { HttpError } = require("../utils/httpError");

const DEFAULT_WAREHOUSE_LABEL = "Toshkent ombori";

function parseOptionalCoords(raw) {
  if (raw == null || raw === "") return null;

  let pair = raw;
  if (typeof raw === "string") {
    const parts = raw
      .split(/[,;\s]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;
    pair = [parts[0], parts[1]];
  }

  if (!Array.isArray(pair) || pair.length < 2) return null;
  const lat = Number(pair[0]);
  const lng = Number(pair[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/**
 * Admin handoff body → saqlash uchun toza obyekt.
 * address majburiy.
 */
function normalizeUzWarehousePickupInput(raw = {}) {
  const source =
    raw && typeof raw === "object" && raw.uzWarehousePickup
      ? raw.uzWarehousePickup
      : raw;

  const address = String(
    source?.address || source?.addressLine || raw?.address || "",
  ).trim();
  if (!address) {
    throw new HttpError(
      400,
      "Ombor manzilini kiriting",
      "WAREHOUSE_ADDRESS_REQUIRED",
    );
  }

  const phone = String(source?.phone || source?.sellerPhone || raw?.phone || "").trim();
  const label =
    String(source?.label || raw?.label || "").trim() || DEFAULT_WAREHOUSE_LABEL;
  const coordinates = parseOptionalCoords(
    source?.coordinates ?? source?.coords ?? raw?.coordinates ?? raw?.coords,
  );

  return {
    address,
    coordinates,
    phone,
    label,
  };
}

function snapshotUzWarehousePickup(raw) {
  if (!raw || typeof raw !== "object") return null;
  const address = String(raw.address || "").trim();
  if (!address) return null;
  const coordinates = parseOptionalCoords(raw.coordinates ?? raw.coords);
  return {
    address,
    coordinates: coordinates || undefined,
    phone: String(raw.phone || "").trim(),
    label: String(raw.label || "").trim() || DEFAULT_WAREHOUSE_LABEL,
  };
}

/**
 * Assignment / API sellerPickup shakli — kuryer UI mos.
 */
function toWarehouseSellerPickup(pickup, sellerId = "") {
  const snap = snapshotUzWarehousePickup(pickup);
  if (!snap) return null;
  return {
    id: String(sellerId || ""),
    name: snap.label,
    address: snap.address,
    sellerPhone: snap.phone,
    coordinates: snap.coordinates || null,
    pickupKind: "warehouse",
  };
}

function hasUzWarehousePickup(raw) {
  return Boolean(snapshotUzWarehousePickup(raw));
}

module.exports = {
  DEFAULT_WAREHOUSE_LABEL,
  normalizeUzWarehousePickupInput,
  snapshotUzWarehousePickup,
  toWarehouseSellerPickup,
  hasUzWarehousePickup,
  parseOptionalCoords,
};
