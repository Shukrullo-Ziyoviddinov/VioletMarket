/**
 * Kuryer «Buyurtmalar» (available) va «Qabul qilish» (accept) — bitta qoida.
 *
 * Taken: assignment hali unitni band qiladi → available'da chiqmaydi.
 * Reacceptable: cancelled → available'da chiqadi, accept qayta faollashtiradi.
 * returned: taken (re_handoff/reactivate assignmentni o‘chiradi → keyin available).
 */

const { CourierOrderAssignment } = require("../models/courierOrderAssignment");

/** Kuryer jarayondagi aktiv holatlar (qabul qilingan, yo‘lda, qaytarish bosqichi) */
const COURIER_IN_PROGRESS_STATUSES = [
  "accepted",
  "en_route_to_seller",
  "arrived_at_seller",
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
  "return_request_pending",
  "return_approved",
  "return_to_seller",
  "en_route_return_to_seller",
  "arrived_return_at_seller",
];

/**
 * Available ro‘yxatidan chiqariladi.
 * cancelled yo‘q — qayta qabul uchun poolga qaytadi (accept bilan bir xil).
 */
const TAKEN_ASSIGNMENT_STATUSES = [
  ...COURIER_IN_PROGRESS_STATUSES,
  "delivered",
  "returned",
];

/** Accept: mavjud assignmentni qayta ochish mumkin */
const REACCEPTABLE_ASSIGNMENT_STATUSES = new Set(["cancelled"]);

function assignmentUnitKey(orderId, itemIndex, unitIndex) {
  return `${Number(orderId)}:${Number(itemIndex)}:${Number(unitIndex) || 0}`;
}

function isTakenAssignmentStatus(status) {
  return TAKEN_ASSIGNMENT_STATUSES.includes(String(status || ""));
}

function isReacceptableAssignmentStatus(status) {
  return REACCEPTABLE_ASSIGNMENT_STATUSES.has(String(status || ""));
}

/**
 * Band unit kalitlari — available filter uchun.
 */
async function loadTakenAssignmentUnitKeys() {
  const rows = await CourierOrderAssignment.find({
    status: { $in: TAKEN_ASSIGNMENT_STATUSES },
  })
    .select({ orderId: 1, itemIndex: 1, unitIndex: 1 })
    .lean();

  return new Set(
    rows.map((row) =>
      assignmentUnitKey(row.orderId, row.itemIndex, row.unitIndex),
    ),
  );
}

module.exports = {
  COURIER_IN_PROGRESS_STATUSES,
  TAKEN_ASSIGNMENT_STATUSES,
  REACCEPTABLE_ASSIGNMENT_STATUSES,
  assignmentUnitKey,
  isTakenAssignmentStatus,
  isReacceptableAssignmentStatus,
  loadTakenAssignmentUnitKeys,
};
