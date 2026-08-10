/**
 * Unit lifecycle — qaytarish zanjiri + Javob bermadi + available/accept qoidalari.
 *
 * 1) returnUnitLifecycleService — Ajdaniya → approve → Qaytardim
 * 2) noAnswerResolutionService — re_handoff / reactivate / deliver
 * 3) assignmentPoolRules — available taken + accept reacceptable
 * Ombor: src/inventory
 */
const {
  createReturnRequestByCourier,
  listReturnRequestsForAdmin,
  approveReturnRequest,
  rejectReturnRequest,
  confirmApprovedReturnReasonByCourier,
  advanceReturnToSellerByCourier,
  completeReturnToSellerByCourier,
  healStuckReturnSiblingsOnView,
  toPublicReturnRequest,
  RETURN_ADVANCE_ACTIONS,
} = require("./returnUnitLifecycleService");

const {
  reHandoffNoAnswerOrder,
  reactivateNoAnswerOrder,
  markDeliveredNoAnswerOrder,
} = require("./noAnswerResolutionService");

const {
  REASON_TYPES,
  SELLER_RETURNED_LIST_REASON_TYPES,
  REQUESTABLE_STATUSES,
  RESOLUTION_TYPES,
} = require("./constants");

const {
  COURIER_IN_PROGRESS_STATUSES,
  TAKEN_ASSIGNMENT_STATUSES,
  REACCEPTABLE_ASSIGNMENT_STATUSES,
  assignmentUnitKey,
  loadTakenAssignmentUnitKeys,
} = require("./assignmentPoolRules");

const { applyReturnStockDisposition, claimAndApplyReturnStockDisposition } = require("./stockDisposition");

module.exports = {
  createReturnRequestByCourier,
  listReturnRequestsForAdmin,
  approveReturnRequest,
  rejectReturnRequest,
  confirmApprovedReturnReasonByCourier,
  advanceReturnToSellerByCourier,
  completeReturnToSellerByCourier,
  healStuckReturnSiblingsOnView,
  toPublicReturnRequest,
  RETURN_ADVANCE_ACTIONS,
  REASON_TYPES,
  SELLER_RETURNED_LIST_REASON_TYPES,
  REQUESTABLE_STATUSES,
  reHandoffNoAnswerOrder,
  reactivateNoAnswerOrder,
  markDeliveredNoAnswerOrder,
  RESOLUTION_TYPES,
  COURIER_IN_PROGRESS_STATUSES,
  TAKEN_ASSIGNMENT_STATUSES,
  REACCEPTABLE_ASSIGNMENT_STATUSES,
  assignmentUnitKey,
  loadTakenAssignmentUnitKeys,
  applyReturnStockDisposition,
  claimAndApplyReturnStockDisposition,
};
