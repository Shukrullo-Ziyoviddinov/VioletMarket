/**
 * Kuryer assignment status — admin + delivery umumiy yorliqlar.
 */

const COURIER_ASSIGNMENT_STATUSES = [
  "accepted",
  "en_route_to_seller",
  "arrived_at_seller",
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
  "delivered",
  "cancelled",
  "return_request_pending",
  "return_approved",
  "return_to_seller",
  "en_route_return_to_seller",
  "arrived_return_at_seller",
  "returned",
];

const STATUS_LABELS_UZ = {
  accepted: "Sotuvchiga borish",
  en_route_to_seller: "Sotuvchiga yo‘lda",
  arrived_at_seller: "Mahsulot olish",
  picked_up: "Mijozga borish",
  en_route_to_customer: "Mijozga yo‘lda",
  arrived_at_customer: "Topshirish",
  delivered: "Topshirilgan",
  cancelled: "Qaytarilgan",
  return_request_pending: "Qaytarish so‘rovi",
  return_approved: "Qaytarish tasdiqlandi",
  return_to_seller: "Sotuvchiga qaytarish",
  en_route_return_to_seller: "Sotuvchiga qaytarish yo‘lda",
  arrived_return_at_seller: "Sotuvchiga qaytarish",
  returned: "Qaytarildi",
};

/** Ketma-ket pozitsiya qadamlari (admin kartochka progress). */
const PROGRESS_STEPS = [
  { key: "accepted", label: "Qabul" },
  { key: "en_route_to_seller", label: "Sotuvchiga" },
  { key: "arrived_at_seller", label: "Keldi" },
  { key: "picked_up", label: "Oldi" },
  { key: "en_route_to_customer", label: "Mijozga" },
  { key: "arrived_at_customer", label: "Yetdi" },
  { key: "delivered", label: "Topshirdi" },
];

const STATUS_STEP_INDEX = {
  accepted: 0,
  en_route_to_seller: 1,
  arrived_at_seller: 2,
  picked_up: 3,
  en_route_to_customer: 4,
  arrived_at_customer: 5,
  delivered: 6,
  cancelled: -1,
  return_request_pending: 5,
  return_approved: 5,
  return_to_seller: -1,
  en_route_return_to_seller: -1,
  arrived_return_at_seller: -1,
  returned: -1,
};

function normalizeCourierAssignmentStatus(status) {
  const value = String(status || "accepted").trim();
  return COURIER_ASSIGNMENT_STATUSES.includes(value) ? value : "accepted";
}

function getCourierAssignmentStatusLabel(status) {
  const normalized = normalizeCourierAssignmentStatus(status);
  return STATUS_LABELS_UZ[normalized] || STATUS_LABELS_UZ.accepted;
}

function getCourierAssignmentProgress(status) {
  const normalized = normalizeCourierAssignmentStatus(status);
  const currentIndex = STATUS_STEP_INDEX[normalized];
  return {
    status: normalized,
    currentIndex,
    steps: PROGRESS_STEPS.map((step, index) => ({
      ...step,
      done: currentIndex >= 0 && index <= currentIndex,
      current: currentIndex >= 0 && index === currentIndex,
    })),
  };
}

function pickAssignmentTimestamps(row = {}) {
  return {
    acceptedAt: row.acceptedAt || null,
    enRouteToSellerAt: row.enRouteToSellerAt || null,
    arrivedAtSellerAt: row.arrivedAtSellerAt || null,
    pickedUpAt: row.pickedUpAt || null,
    enRouteToCustomerAt: row.enRouteToCustomerAt || null,
    arrivedAtCustomerAt: row.arrivedAtCustomerAt || null,
    deliveredAt: row.deliveredAt || null,
    enRouteReturnToSellerAt: row.enRouteReturnToSellerAt || null,
    arrivedReturnAtSellerAt: row.arrivedReturnAtSellerAt || null,
    returnedAt: row.returnedAt || null,
  };
}

module.exports = {
  COURIER_ASSIGNMENT_STATUSES,
  STATUS_LABELS_UZ,
  PROGRESS_STEPS,
  normalizeCourierAssignmentStatus,
  getCourierAssignmentStatusLabel,
  getCourierAssignmentProgress,
  pickAssignmentTimestamps,
};
