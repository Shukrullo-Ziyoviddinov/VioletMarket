const { Order } = require("../../models/order");
const { SellerAccount } = require("../../models/sellerAccount");
const { createInitialOrderTracking } = require("../unitTracking/orderTracking");
const {
  requireDeliveryRegionAddress,
} = require("../../utils/normalizeDeliveryAddress");
const { normalizePaymentMethod } = require("./paymentMethods");
const { resolveOptionLabel } = require("../../unitLifecycle/optionLabel");
const {
  resolveCheckoutCargoServiceType,
} = require("../../utils/cargoServiceType");

const PAYMENT_SOURCES = {
  CHECKOUT: "checkout",
  DELIVERY_ADMIN: "delivery-admin",
};

function cleanSellerId(value) {
  return String(value || "").trim();
}

async function loadSellerCountryMap(sellerIds) {
  const ids = [
    ...new Set(
      (Array.isArray(sellerIds) ? sellerIds : [])
        .map((id) => cleanSellerId(id))
        .filter(Boolean),
    ),
  ];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select({ id: 1, sellerCountry: 1 })
    .lean();

  return new Map(
    rows.map((row) => [cleanSellerId(row.id), String(row.sellerCountry || "")]),
  );
}

function mapCartItemToOrderItem(
  item,
  productMap,
  sellerCountryMap,
  selectedCargoOptions,
  requireCargoSelection = false,
) {
  const row = item?.toObject ? item.toObject() : item;
  if (!row) return null;

  const productId = Number(row.productId);
  const quantity = Math.max(1, Number(row.quantity) || 1);
  const price = Math.max(0, Number(row.price) || 0);
  const product = productMap.get(productId) ?? productMap.get(row.productId);
  const sellerId = cleanSellerId(product?.sellerId);
  const sellerCountry = sellerId ? sellerCountryMap.get(sellerId) || "" : "";
  const cargoServiceType = resolveCheckoutCargoServiceType({
    sellerCountry,
    cargoExpressPolicy: row.cargoExpressPolicy ?? product?.cargoExpressPolicy,
    itemCountries: row.countries || product?.countries,
    selectedCargoOptions,
    storedType: row.cargoServiceType,
    requireSelection: requireCargoSelection,
  });

  return {
    productId,
    sellerId,
    title: row.title ?? "",
    price,
    originalPrice: Math.max(0, Number(row.originalPrice) || 0),
    quantity,
    lineTotal: price * quantity,
    color: resolveOptionLabel(row.color),
    size: resolveOptionLabel(row.size),
    storage: resolveOptionLabel(row.storage),
    model: resolveOptionLabel(row.model),
    image: String(row.image || "/img/no-image.png"),
    cargoServiceType,
    ...createInitialOrderTracking(),
  };
}

function buildOrderItemsFromCart(
  cartItems,
  productMap,
  sellerCountryMap = new Map(),
  selectedCargoOptions = {},
  requireCargoSelection = false,
) {
  return (Array.isArray(cartItems) ? cartItems : [])
    .map((item) =>
      mapCartItemToOrderItem(
        item,
        productMap,
        sellerCountryMap,
        selectedCargoOptions,
        requireCargoSelection,
      ),
    )
    .filter(Boolean);
}

function calcOrderTotalAmount(items) {
  return items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
}

/**
 * Savatdan buyurtma yozuvini yaratish.
 * Checkout mahsulot to‘lovi bitta (order.totalAmount = mahsulotlar).
 * Cargo yetkazish to‘lovi bu yerda olinmaydi — Toshkentda Standard/Express alohida.
 * Sotuv/daromad (siller + asosiy admin) bu yerda yozilmaydi —
 * faqat kuryer/asosiy admin "Topshirdim" da recordSalesOnDelivery orqali.
 */
async function recordCartPayment({
  userId,
  cartItems,
  productMap,
  paymentMethod,
  source = PAYMENT_SOURCES.CHECKOUT,
  status = "paid",
  deliveryAddress = null,
  selectedCargoOptions = {},
}) {
  const requireCargoSelection = source === PAYMENT_SOURCES.CHECKOUT;
  const previewItems = (Array.isArray(cartItems) ? cartItems : [])
    .map((item) => {
      const row = item?.toObject ? item.toObject() : item;
      const productId = Number(row?.productId);
      const product = productMap.get(productId) ?? productMap.get(row?.productId);
      return cleanSellerId(product?.sellerId);
    })
    .filter(Boolean);
  const sellerCountryMap = await loadSellerCountryMap(previewItems);

  const items = buildOrderItemsFromCart(
    cartItems,
    productMap,
    sellerCountryMap,
    selectedCargoOptions,
    requireCargoSelection,
  );
  if (items.length === 0) {
    return null;
  }

  const totalAmount = calcOrderTotalAmount(items);
  const paidAt = status === "paid" ? new Date() : null;
  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod, {
    allowMock: source !== PAYMENT_SOURCES.CHECKOUT,
  });
  const normalizedAddress = requireDeliveryRegionAddress(deliveryAddress);

  const order = await Order.create({
    userId,
    items,
    totalAmount,
    paymentMethod: normalizedPaymentMethod,
    status,
    paidAt,
    source,
    deliveryAddress: normalizedAddress,
  });

  return order;
}

module.exports = {
  PAYMENT_SOURCES,
  buildOrderItemsFromCart,
  calcOrderTotalAmount,
  recordCartPayment,
};
