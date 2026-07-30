const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");
const {
  ALL_ORDER_TRACKING_STATUSES,
} = require("../productManagement/orderTracking");

const TRACKING_STATUSES = ALL_ORDER_TRACKING_STATUSES;

const orderTrackingHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: TRACKING_STATUSES,
      required: true,
    },
    at: { type: Date, required: true },
  },
  { _id: false },
);

/** Xorij → UZB: admin kiritgan ombor pickup (faqat foreign handoff) */
const uzWarehousePickupSchema = new mongoose.Schema(
  {
    address: { type: String, default: "", trim: true },
    coordinates: { type: [Number], default: undefined },
    phone: { type: String, default: "", trim: true },
    label: { type: String, default: "Toshkent ombori", trim: true },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    sellerId: { type: String, default: "" },
    title: { type: mongoose.Schema.Types.Mixed, default: "" },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    lineTotal: { type: Number, default: 0 },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    storage: { type: String, default: "" },
    model: { type: String, default: "" },
    image: { type: String, default: "/img/no-image.png" },
    trackingStatus: {
      type: String,
      enum: TRACKING_STATUSES,
      default: "accepted",
    },
    trackingHistory: {
      type: [orderTrackingHistorySchema],
      default: [],
    },
    uzWarehousePickup: {
      type: uzWarehousePickupSchema,
      default: undefined,
    },
  },
  { _id: false },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    region: { type: String, default: "", trim: true, index: true },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    placeType: { type: String, default: "" },
    entrance: { type: String, default: "" },
    floor: { type: String, default: "" },
    domofon: { type: String, default: "" },
    courierNote: { type: String, default: "" },
    coords: {
      type: [Number],
      default: undefined,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "mock" },
    status: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "paid",
      index: true,
    },
    paidAt: { type: Date, default: null, index: true },
    source: {
      type: String,
      enum: ["checkout", "delivery-admin"],
      default: "checkout",
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      default: null,
    },
  },
  {
    collection: "orders",
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, paidAt: -1 });
orderSchema.index({ "items.sellerId": 1, paidAt: -1 });
orderSchema.index({ "items.trackingStatus": 1, paidAt: -1 });
orderSchema.index({ "deliveryAddress.region": 1, "deliveryAddress.district": 1 });
orderSchema.index({ "deliveryAddress.city": 1, "deliveryAddress.district": 1 });

orderSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "order_id");
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = { Order, TRACKING_STATUSES };
