const { asyncHandler } = require("../utils/asyncHandler");
const { listSellerOrders } = require("../productManagement/sellerOrders");
const sellerOrderTrackingService = require("../services/sellerOrders/sellerOrderTrackingService");
const {
  listSellerReturnedOrders,
} = require("../services/sellerOrders/sellerReturnedOrdersService");
const noAnswerOrderActionsService = require("../services/noAnswerOrders/noAnswerOrderActionsService");
const cargoShipmentSellerService = require("../services/cargoShipments/cargoShipmentSellerService");

const listOrders = asyncHandler(async (req, res) => {
  const data = await listSellerOrders(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

const listReturnedOrders = asyncHandler(async (req, res) => {
  const data = await listSellerReturnedOrders(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

const confirmOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.confirmSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

const collectOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.collectSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

const handoffOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.handoffSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

const cancelOrderItem = asyncHandler(async (req, res) => {
  const data = await sellerOrderTrackingService.cancelSellerOrderItem(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
  );
  res.json({ ok: true, data });
});

const reHandoffNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.reHandoffNoAnswerOrder(
    req.params.returnedOrderId,
    { sellerId: req.sellerShopId, resolvedBy: "seller" },
  );
  res.json({ ok: true, data });
});

const reactivateNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.reactivateNoAnswerOrder(
    req.params.returnedOrderId,
    { sellerId: req.sellerShopId, resolvedBy: "seller" },
  );
  res.json({ ok: true, data });
});

const deliverNoAnswer = asyncHandler(async (req, res) => {
  const data = await noAnswerOrderActionsService.markDeliveredNoAnswerOrder(
    req.params.returnedOrderId,
    { sellerId: req.sellerShopId, resolvedBy: "seller" },
  );
  res.json({ ok: true, data });
});

const submitToCargo = asyncHandler(async (req, res) => {
  const data = await cargoShipmentSellerService.submitSellerOrderItemToCargo(
    req.sellerShopId,
    req.params.orderId,
    req.params.itemIndex,
    req.body || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  listReturnedOrders,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
  cancelOrderItem,
  reHandoffNoAnswer,
  reactivateNoAnswer,
  deliverNoAnswer,
  submitToCargo,
};
