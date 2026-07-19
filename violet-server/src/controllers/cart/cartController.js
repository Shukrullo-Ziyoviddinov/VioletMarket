const cartService = require("../../services/cart/cartService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getMyCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCartForUser(req.userId);
  res.json({ ok: true, ...data });
});

const addItem = asyncHandler(async (req, res) => {
  const data = await cartService.addCartItem(req.userId, req.body || {});
  res.json({ ok: true, ...data });
});

const updateQuantity = asyncHandler(async (req, res) => {
  const { change } = req.body || {};
  const data = await cartService.updateCartItemQuantity(
    req.userId,
    req.params.itemId,
    change,
  );
  res.json({ ok: true, ...data });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeCartItem(req.userId, req.params.itemId);
  res.json({ ok: true, ...data });
});

const clearCart = asyncHandler(async (req, res) => {
  const data = await cartService.clearCartForUser(req.userId);
  res.json({ ok: true, ...data });
});

const checkout = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const paymentMethod = body.paymentMethod ?? body.payment_method;
  const deliveryAddress =
    body.deliveryAddress ??
    body.address ??
    body.delivery_address ??
    body.checkoutAddress ??
    null;
  const data = await cartService.checkoutCartForUser(req.userId, {
    paymentMethod,
    deliveryAddress,
  });
  res.json({
    ok: true,
    ...data,
    paymentMethod: data?.paymentMethod || paymentMethod || null,
    deliveryAddress: data?.deliveryAddress || null,
  });
});

const saveDeliveryAddress = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const deliveryAddress =
    body.deliveryAddress ?? body.address ?? body.checkoutAddress ?? body;
  const data = await cartService.saveDeliveryAddressForUser(
    req.userId,
    deliveryAddress,
  );
  res.json({ ok: true, ...data });
});

const dismissUrgency = asyncHandler(async (req, res) => {
  const data = await cartService.dismissCartUrgency(req.userId, req.params.itemId);
  res.json({ ok: true, ...data });
});

module.exports = {
  getMyCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  checkout,
  saveDeliveryAddress,
  dismissUrgency,
};
