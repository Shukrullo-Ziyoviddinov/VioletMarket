/**
 * Cargo shipment — dona (unitIndex) qaytarish yordamchilari.
 * Unique (orderId, itemIndex, sellerId) saqlanadi; products[] o‘chirilmaydi.
 */

const PRODUCT_RETURN_STATUSES = [
  "active",
  "return_request_pending",
  "return_approved",
  "returned",
];

function resolveProductReturnStatus(product) {
  const status = String(product?.returnStatus || "active")
    .trim()
    .toLowerCase();
  return PRODUCT_RETURN_STATUSES.includes(status) ? status : "active";
}

function isProductActiveForCargo(product) {
  return resolveProductReturnStatus(product) === "active";
}

function listShipmentProducts(shipment) {
  return Array.isArray(shipment?.products) ? shipment.products : [];
}

function findShipmentProductByUnitIndex(shipment, unitIndexRaw) {
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  const products = listShipmentProducts(shipment);
  const found = products.find(
    (row) => Number(row?.unitIndex) === unitIndex,
  );
  if (found) return found;
  // Legacy: unitIndex yozilmagan bitta product
  if (products.length === 1 && unitIndex === 0) return products[0];
  return null;
}

function listActiveProductUnitIndexes(shipment) {
  return listShipmentProducts(shipment)
    .filter(isProductActiveForCargo)
    .map((row, index) =>
      Number.isInteger(Number(row?.unitIndex))
        ? Number(row.unitIndex)
        : index,
    );
}

function normalizeCargoUnitIndexes(raw, shipment) {
  const active = new Set(listActiveProductUnitIndexes(shipment));
  const products = listShipmentProducts(shipment);
  const allIndexes = products.map((row, index) =>
    Number.isInteger(Number(row?.unitIndex)) ? Number(row.unitIndex) : index,
  );

  const list = Array.isArray(raw) ? raw : raw == null ? null : [raw];
  if (list == null) {
    // Eski API: birinchi faol dona (yoki 0)
    if (active.size) return [[...active][0]];
    return allIndexes.length ? [allIndexes[0]] : [0];
  }

  return [
    ...new Set(
      list
        .map((value) => Math.floor(Number(value)))
        .filter((value) => Number.isInteger(value) && value >= 0),
    ),
  ].sort((a, b) => a - b);
}

function setProductReturnStatus(shipment, unitIndexRaw, returnStatus) {
  const product = findShipmentProductByUnitIndex(shipment, unitIndexRaw);
  if (!product) return null;
  product.returnStatus = resolveProductReturnStatus({ returnStatus });
  if (product.returnStatus === "returned") {
    product.returnedAt = product.returnedAt || new Date();
  }
  return product;
}

/**
 * products[] returnStatus dan shipment.status agregati.
 * Faol dona qolsa — pending/accepted (qulflanmaydi).
 */
function recomputeShipmentStatusFromProducts(shipment) {
  const products = listShipmentProducts(shipment);
  if (!products.length) return String(shipment.status || "pending");

  const statuses = products.map(resolveProductReturnStatus);

  if (statuses.every((status) => status === "returned")) {
    shipment.status = "returned_to_seller";
    shipment.returnedAt = shipment.returnedAt || new Date();
    return shipment.status;
  }

  const hasActive = statuses.some((status) => status === "active");
  if (hasActive) {
    const operational =
      shipment.acceptedAt || shipment.logisticaId ? "accepted" : "pending";
    // Jarayon qulflangan return_* dan chiqaramiz — qolgan donalar davom etsin
    if (
      ["return_request_pending", "return_approved", "returned_to_seller"].includes(
        String(shipment.status || ""),
      )
    ) {
      shipment.status = operational;
    } else if (
      String(shipment.status || "") !== "pending" &&
      String(shipment.status || "") !== "accepted"
    ) {
      shipment.status = operational;
    }
    return shipment.status;
  }

  // Faol yo‘q — hammasi return oqimida
  if (statuses.some((status) => status === "return_approved")) {
    shipment.status = "return_approved";
  } else {
    shipment.status = "return_request_pending";
  }
  return shipment.status;
}

/** Buyurtma qatori dona summasi (1 dona). */
function resolveCargoUnitAmount(orderItem, qtyHint = 1) {
  const lineQty = Math.max(
    1,
    Math.floor(Number(orderItem?.quantity) || Number(qtyHint) || 1),
  );
  const unitPrice = Math.max(0, Number(orderItem?.price) || 0);
  const lineTotal = Math.max(0, Number(orderItem?.lineTotal) || 0);
  return Math.max(
    0,
    unitPrice || (lineQty > 0 ? Math.round(lineTotal / lineQty) : 0),
  );
}

module.exports = {
  PRODUCT_RETURN_STATUSES,
  resolveProductReturnStatus,
  isProductActiveForCargo,
  listShipmentProducts,
  findShipmentProductByUnitIndex,
  listActiveProductUnitIndexes,
  normalizeCargoUnitIndexes,
  setProductReturnStatus,
  recomputeShipmentStatusFromProducts,
  resolveCargoUnitAmount,
};
