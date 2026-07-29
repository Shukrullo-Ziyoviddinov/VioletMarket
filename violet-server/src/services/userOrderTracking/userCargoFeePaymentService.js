/**
 * Mijoz — cargo yetkazish summasi to‘lovi (Buyurtmalarim).
 * Qoida: productManagement/foreignCargoFeePayment.js
 */

const mongoose = require("mongoose");
const { Order } = require("../../models/order");
const { CargoShipment } = require("../../models/cargoShipment");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  applyCustomerCargoFeePayment,
  toCargoFeePaymentView,
  isCargoFeeRequestReady,
} = require("../../productManagement/foreignCargoFeePayment");

function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  const text = String(title || "").trim();
  return { uz: text, ru: text };
}

async function loadOwnedShipment(userId, shipmentIdRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const order = await Order.findOne({ id: Number(shipment.orderId), userId })
    .select({ id: 1, userId: 1, items: 1 })
    .lean();
  if (!order) {
    throw new HttpError(403, "Bu yuk sizga tegishli emas", "SHIPMENT_FORBIDDEN");
  }

  const item = order.items?.[Number(shipment.itemIndex)];
  if (!item || String(item.sellerId || "").trim() !== String(shipment.sellerId || "").trim()) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  return { shipment, order, item };
}

function toCustomerCargoFeeDetail(shipment, item) {
  const payment = toCargoFeePaymentView(shipment);
  const first = Array.isArray(shipment.products) ? shipment.products[0] : null;

  return {
    shipmentId: String(shipment._id),
    requestCode: String(shipment.requestCode || ""),
    orderId: Number(shipment.orderId) || 0,
    itemIndex: Number(shipment.itemIndex) || 0,
    product: {
      productId: Number(first?.productId || item?.productId) || 0,
      title: resolveProductTitle(first?.title || item?.title),
      imageUrl: resolvePublicAssetUrl(
        first?.image || item?.image || "/img/no-image.png",
      ),
      color: String(first?.color || item?.color || ""),
      size: String(first?.size || item?.size || ""),
      storage: String(first?.storage || item?.storage || ""),
      model: String(first?.model || item?.model || ""),
      quantity: Math.max(1, Number(first?.quantity || item?.quantity) || 1),
    },
    payment,
  };
}

async function getMyCargoFeePaymentDetail(userId, shipmentIdRaw) {
  const { shipment, item } = await loadOwnedShipment(userId, shipmentIdRaw);
  if (!isCargoFeeRequestReady(shipment)) {
    throw new HttpError(
      409,
      "Yuk to‘lov so‘rovi hali tayyor emas",
      "CARGO_FEE_REQUEST_NOT_READY",
    );
  }
  return { detail: toCustomerCargoFeeDetail(shipment, item) };
}

async function payMyCargoFee(userId, shipmentIdRaw, paymentMethodRaw) {
  const { shipment, item } = await loadOwnedShipment(userId, shipmentIdRaw);
  const result = await applyCustomerCargoFeePayment(shipment, paymentMethodRaw);
  return {
    alreadyPaid: Boolean(result.alreadyPaid),
    detail: toCustomerCargoFeeDetail(shipment, item),
  };
}

module.exports = {
  getMyCargoFeePaymentDetail,
  payMyCargoFee,
};
