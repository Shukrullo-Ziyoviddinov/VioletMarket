/**
 * Unit lifecycle holatlari / sabab turlari.
 *
 * Zanjir (qaytarish):
 *   picked_up|en_route|arrived_at_customer
 *     → return_request_pending   (Ajdaniya)
 *     → return_approved          (admin: no_answer | return)
 *     → return_to_seller         (kuryer tasdiq)
 *     → en_route_return_to_seller
 *     → arrived_return_at_seller
 *     → returned                 (Qaytardim)
 *
 * returned + reasonType=no_answer (Javob bermadi):
 *     → re_handoff   (qayta kuryerga)
 *     → reactivated  (omborga +1)
 *     → delivered    (mijozga topshirildi)
 */

const REASON_TYPES = new Set(["no_answer", "return"]);

const REQUESTABLE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

const RESOLUTION_TYPES = new Set(["re_handoff", "reactivated", "delivered"]);

const RETURN_ADVANCE_ACTIONS = {
  go_return_to_seller: {
    from: ["return_to_seller"],
    to: "en_route_return_to_seller",
    atField: "enRouteReturnToSellerAt",
    errorMessage: "Avval sotuvchiga qaytarishni boshlang",
  },
  arrive_return_seller: {
    from: ["en_route_return_to_seller"],
    to: "arrived_return_at_seller",
    atField: "arrivedReturnAtSellerAt",
    errorMessage: "Avval sotuvchiga yo‘lga chiqing",
  },
};

module.exports = {
  REASON_TYPES,
  REQUESTABLE_STATUSES,
  RESOLUTION_TYPES,
  RETURN_ADVANCE_ACTIONS,
};
