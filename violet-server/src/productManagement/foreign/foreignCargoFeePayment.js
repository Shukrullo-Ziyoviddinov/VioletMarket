/**
 * Xorij cargo yetkazish summasi to‘lovi — bitta qoida.
 *
 * Zanjir (faqat yangi so‘rovlar: cargoFeePaymentRequired=true):
 *   Clientga yuborish (uzArrivedAt + fee + required)
 *   → mijoz marketga to‘laydi (customerCargoFeePaidAt)
 *   → asosiy admin tasdiqlaydi (adminCargoFeeConfirmedAt)
 *   → logistica To‘landi (paidAt) — applyMarkShipmentPaid
 *
 * Legacy: cargoFeePaymentRequired yo‘q/false (eski Toshkent yuklari)
 *   → To‘landi uchun admin tasdiq shart emas.
 *
 * Checkout mahsulot to‘lovi bo‘linmaydi.
 * Ikki yo‘lak = ikkita cargo fee (Standard va Express alohida).
 */

const { HttpError } = require("../../utils/httpError");
const { normalizePaymentMethod } = require("../checkout/paymentMethods");

const CARGO_FEE_PAYMENT_METHODS = new Set(["payme", "click"]);

const ADMIN_CARGO_FEE_FILTERS = ["all", "paid", "unpaid"];

/** Yangi «Clientga yuborish» oqimi — to‘lov majburiy (fee-bearer) */
function isCargoFeePaymentRequired(shipment) {
  return Boolean(shipment?.cargoFeePaymentRequired);
}

/** Guruhdagi umumiy to‘lov yozuvi shu shipmentda */
function isCargoFeeBearer(shipment) {
  return isCargoFeePaymentRequired(shipment);
}

/**
 * Guruh sibling: Toshkentga o‘tgan, lekin fee yozilmagan.
 * To‘landi to‘g‘ridan-to‘g‘ri ochilmasin (faqat fee-bearer + fan-out).
 */
function isGroupNonFeeWarehouseSibling(shipment) {
  if (!shipment?.uzArrivedAt) return false;
  if (String(shipment.processStep || "") !== "toshkent_omborida") return false;
  if (isCargoFeePaymentRequired(shipment)) return false;
  return Number(shipment.cargoDeliveryFee) === 0;
}

/** Toshkentga kelgan (fizik so‘rov tayyor) */
function isUzWarehouseArrived(shipment) {
  if (!shipment) return false;
  if (String(shipment.status || "") !== "accepted") return false;
  if (String(shipment.processStep || "") !== "toshkent_omborida") return false;
  if (!shipment.uzArrivedAt) return false;
  return Number(shipment.cargoDeliveryFee) >= 0;
}

/**
 * Mijoz/admin to‘lov UI va amallar uchun — faqat yangi oqim.
 */
function isCargoFeeRequestReady(shipment) {
  return isUzWarehouseArrived(shipment) && isCargoFeePaymentRequired(shipment);
}

function isCustomerCargoFeePaid(shipment) {
  return Boolean(shipment?.customerCargoFeePaidAt);
}

function isAdminCargoFeeConfirmed(shipment) {
  return Boolean(shipment?.adminCargoFeeConfirmedAt);
}

/**
 * Logistica «To‘landi» ochiqmi.
 * Fee-bearer (yangi): admin tasdiq.
 * Guruh sibling (fee yo‘q): ochiq emas — fan-out kutadi.
 * Legacy (required=false, fee>0 yoki eski): Toshkent + !paidAt.
 */
function canLogisticaMarkPaid(shipment) {
  if (!isUzWarehouseArrived(shipment)) return false;
  if (shipment.paidAt) return false;
  if (isGroupNonFeeWarehouseSibling(shipment)) return false;
  if (!isCargoFeePaymentRequired(shipment)) return true;
  return isAdminCargoFeeConfirmed(shipment);
}

/**
 * Logistica «To‘landi» uchun qo‘shimcha shart (faqat yangi oqim).
 */
function assertAdminCargoFeeConfirmedForMarkPaid(shipment) {
  if (!isCargoFeePaymentRequired(shipment)) return;
  if (isAdminCargoFeeConfirmed(shipment)) return;
  throw new HttpError(
    409,
    "Avval asosiy admin mijoz to‘lovini tasdiqlashi kerak",
    "ADMIN_CARGO_FEE_CONFIRM_REQUIRED",
  );
}

function normalizeCargoFeePaymentMethod(raw) {
  const method = normalizePaymentMethod(raw, { allowMock: false });
  if (!CARGO_FEE_PAYMENT_METHODS.has(method)) {
    throw new HttpError(
      400,
      "Faqat Payme yoki Click tanlang",
      "INVALID_CARGO_FEE_PAYMENT_METHOD",
    );
  }
  return method;
}

function normalizeAdminCargoFeeFilter(raw) {
  const key = String(raw || "all")
    .trim()
    .toLowerCase();
  if (!ADMIN_CARGO_FEE_FILTERS.includes(key)) {
    throw new HttpError(400, "Filter noto‘g‘ri", "INVALID_FEE_FILTER");
  }
  return key;
}

/**
 * Admin ro‘yxat — faqat yangi to‘lov oqimidagi so‘rovlar.
 */
function buildAdminCargoFeeListMatch(filterRaw = "all") {
  const filter = normalizeAdminCargoFeeFilter(filterRaw);
  const match = {
    status: "accepted",
    processStep: "toshkent_omborida",
    uzArrivedAt: { $ne: null },
    cargoFeePaymentRequired: true,
  };

  if (filter === "paid") {
    match.adminCargoFeeConfirmedAt = { $ne: null };
  } else if (filter === "unpaid") {
    match.adminCargoFeeConfirmedAt = null;
  }

  return { filter, match };
}

/**
 * Mijoz to‘lovi (hozircha stub — keyin Click/Payme tekshiruvi shu yerda).
 */
async function applyCustomerCargoFeePayment(shipment, paymentMethodRaw) {
  if (!isCargoFeeRequestReady(shipment)) {
    throw new HttpError(
      409,
      "Yuk to‘lov so‘rovi hali tayyor emas",
      "CARGO_FEE_REQUEST_NOT_READY",
    );
  }

  if (shipment.paidAt) {
    throw new HttpError(
      409,
      "Yuk allaqachon To‘landi holatida",
      "SHIPMENT_ALREADY_PAID",
    );
  }

  if (isCustomerCargoFeePaid(shipment)) {
    return { alreadyPaid: true };
  }

  const method = normalizeCargoFeePaymentMethod(paymentMethodRaw);
  shipment.customerCargoFeePaidAt = new Date();
  shipment.customerCargoFeePaymentMethod = method;
  await shipment.save();
  return { alreadyPaid: false };
}

/**
 * Asosiy admin: mijoz to‘lovini logistica uchun tasdiqlash.
 */
async function applyAdminCargoFeeConfirm(shipment) {
  if (!isCargoFeeRequestReady(shipment)) {
    throw new HttpError(
      409,
      "Yuk to‘lov so‘rovi hali tayyor emas",
      "CARGO_FEE_REQUEST_NOT_READY",
    );
  }

  if (!isCustomerCargoFeePaid(shipment)) {
    throw new HttpError(
      409,
      "Avval mijoz to‘lovi kerak",
      "CUSTOMER_CARGO_FEE_NOT_PAID",
    );
  }

  if (isAdminCargoFeeConfirmed(shipment)) {
    return { alreadyConfirmed: true };
  }

  shipment.adminCargoFeeConfirmedAt = new Date();
  await shipment.save();
  return { alreadyConfirmed: false };
}

function toCargoFeePaymentView(shipment) {
  if (!shipment) return null;
  const ready = isCargoFeeRequestReady(shipment);
  return {
    ready,
    paymentRequired: isCargoFeePaymentRequired(shipment),
    weightKg: Math.max(0, Number(shipment.weightKg) || 0),
    cargoDeliveryFee: Math.max(0, Number(shipment.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(shipment.uzArrivalPhotoUrl || ""),
    uzArrivalComment: String(shipment.uzArrivalComment || ""),
    uzArrivedAt: shipment.uzArrivedAt || null,
    customerPaidAt: shipment.customerCargoFeePaidAt || null,
    customerPaymentMethod: shipment.customerCargoFeePaymentMethod || null,
    adminConfirmedAt: shipment.adminCargoFeeConfirmedAt || null,
    logisticaPaidAt: shipment.paidAt || null,
    canCustomerPay: ready && !isCustomerCargoFeePaid(shipment) && !shipment.paidAt,
    canAdminConfirm:
      ready && isCustomerCargoFeePaid(shipment) && !isAdminCargoFeeConfirmed(shipment),
    canLogisticaMarkPaid: canLogisticaMarkPaid(shipment),
  };
}

module.exports = {
  CARGO_FEE_PAYMENT_METHODS,
  ADMIN_CARGO_FEE_FILTERS,
  isCargoFeePaymentRequired,
  isCargoFeeBearer,
  isGroupNonFeeWarehouseSibling,
  isUzWarehouseArrived,
  isCargoFeeRequestReady,
  isCustomerCargoFeePaid,
  isAdminCargoFeeConfirmed,
  canLogisticaMarkPaid,
  assertAdminCargoFeeConfirmedForMarkPaid,
  normalizeCargoFeePaymentMethod,
  normalizeAdminCargoFeeFilter,
  buildAdminCargoFeeListMatch,
  applyCustomerCargoFeePayment,
  applyAdminCargoFeeConfirm,
  toCargoFeePaymentView,
};
