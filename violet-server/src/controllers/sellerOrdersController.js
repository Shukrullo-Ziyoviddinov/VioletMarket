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

const confirmOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await sellerOrderTrackingService.confirmSellerOrderGroup(
    req.sellerShopId,
    req.params.orderId,
    { itemIndexes: body.itemIndexes },
  );
  res.json({ ok: true, data });
});

const collectOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await sellerOrderTrackingService.collectSellerOrderGroup(
    req.sellerShopId,
    req.params.orderId,
    { itemIndexes: body.itemIndexes },
  );
  res.json({ ok: true, data });
});

const handoffOrderGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await sellerOrderTrackingService.handoffSellerOrderGroup(
    req.sellerShopId,
    req.params.orderId,
    { itemIndexes: body.itemIndexes },
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

const submitToCargoGroup = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await cargoShipmentSellerService.submitSellerOrderGroupToCargo(
    req.sellerShopId,
    req.params.orderId,
    body,
  );
  res.json({ ok: true, data });
});

const listCargoWarehouseContacts = asyncHandler(async (req, res) => {
  const data =
    await cargoShipmentSellerService.listSellerCargoWarehouseContacts(
      req.sellerShopId,
    );
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
  listReturnedOrders,
  confirmOrderItem,
  collectOrderItem,
  handoffOrderItem,
  confirmOrderGroup,
  collectOrderGroup,
  handoffOrderGroup,
  cancelOrderItem,
  reHandoffNoAnswer,
  reactivateNoAnswer,
  deliverNoAnswer,
  submitToCargo,
  submitToCargoGroup,
  listCargoWarehouseContacts,
};
