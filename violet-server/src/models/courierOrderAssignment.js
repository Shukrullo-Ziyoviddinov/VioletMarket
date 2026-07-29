const mongoose = require("mongoose");

/**
 * Kuryer qabul qilgan (olgan) mahsulotlar — alohida collection.
 * Keyinchalik kuryer daromadi / olingan mahsulotlar tarixi shu yerdan olinadi.
 */
const courierOrderAssignmentSchema = new mongoose.Schema(
  {
    orderId: { type: Number, required: true, index: true },
    itemIndex: { type: Number, required: true },
    unitIndex: { type: Number, required: true, default: 0 },
    productId: { type: Number, required: true, index: true },
    productCode: { type: String, default: "" },
    sellerId: { type: String, required: true, index: true },
    title: {
      uz: { type: String, default: "" },
      ru: { type: String, default: "" },
    },
    amount: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAccount",
      required: true,
      index: true,
    },
    courier: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    customer: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    deliveryAddress: {
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      addressLine: { type: String, default: "" },
      placeType: { type: String, default: "" },
      entrance: { type: String, default: "" },
      floor: { type: String, default: "" },
      domofon: { type: String, default: "" },
      courierNote: { type: String, default: "" },
      coords: { type: [Number], default: undefined },
    },

    /**
     * Xorij: admin Xorij→UZB da kiritgan ombor manzili (snapshot).
     * Bo‘sh = UZB siller pickup (SellerAccount).
     */
    warehousePickup: {
      address: { type: String, default: "", trim: true },
      coordinates: { type: [Number], default: undefined },
      phone: { type: String, default: "", trim: true },
      label: { type: String, default: "", trim: true },
    },

    status: {
      type: String,
      enum: [
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
      ],
      default: "accepted",
      index: true,
    },
    handedToCourierAt: { type: Date, default: null },
    acceptedAt: { type: Date, required: true, index: true },
    enRouteToSellerAt: { type: Date, default: null },
    arrivedAtSellerAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    enRouteToCustomerAt: { type: Date, default: null },
    arrivedAtCustomerAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null, index: true },
    /** Admin tasdiqlagan qaytarish turi (no_answer | return | defective) */
    approvedReturnReasonType: {
      type: String,
      enum: ["no_answer", "return", "defective"],
      default: undefined,
    },
    enRouteReturnToSellerAt: { type: Date, default: null },
    arrivedReturnAtSellerAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null, index: true },
    distanceKm: { type: Number, default: null },
    courierPayment: { type: Number, default: 0 },
    courierPaymentUpdatedAt: { type: Date, default: null },
  },
  {
    collection: "courier_order_assignments",
    timestamps: true,
    versionKey: false,
  },
);

courierOrderAssignmentSchema.index(
  { orderId: 1, itemIndex: 1, unitIndex: 1 },
  { unique: true },
);
courierOrderAssignmentSchema.index({ sellerId: 1, acceptedAt: -1 });
courierOrderAssignmentSchema.index({ deliveryId: 1, acceptedAt: -1 });
courierOrderAssignmentSchema.index({ deliveryId: 1, status: 1, deliveredAt: -1 });

const CourierOrderAssignment =
  mongoose.models.CourierOrderAssignment ||
  mongoose.model("CourierOrderAssignment", courierOrderAssignmentSchema);

module.exports = { CourierOrderAssignment };
