const { SellerProductSale } = require("../../models/sellerProductSale");
const { SellerAccount } = require("../../models/sellerAccount");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { isProductActiveOnClient } = require("../../utils/productClientVisibility");
const { computeEffectiveQuantity } = require("../productService");
const { toNumber } = require("./salesStatisticsHelpers");
const { backfillSellerProductSalesFromOrders } = require("../../productManagement/recordSellerProductSales");

function pickSellerName(seller) {
  if (!seller?.name) return "";
  if (typeof seller.name === "string") return seller.name;
  return seller.name.uz || seller.name.ru || "";
}

function pickProductTitle(title) {
  if (!title) return "";
  if (typeof title === "string") return title;
  return title.uz || title.ru || "";
}

function pickProductImage(product, saleImage) {
  const saleImageValue = String(saleImage || "").trim();
  if (saleImageValue && saleImageValue !== "/img/no-image.png") {
    return saleImageValue;
  }

  const firstColor = Array.isArray(product?.colors) ? product.colors[0] : null;
  const productImage = String(
    product?.image || product?.mainImage || firstColor?.mainImage || "",
  ).trim();
  return productImage || saleImageValue || "/img/no-image.png";
}

function resolveRemainingQuantity(product) {
  if (!product) return null;
  return computeEffectiveQuantity(product);
}

function resolveProductDisplayStatus(product) {
  if (!product) {
    return {
      key: "deleted",
      label: "O'chirilgan",
    };
  }

  if (!isProductActiveOnClient(product)) {
    return {
      key: "paused",
      label: "Vaqtincha to'xtatilgan",
    };
  }

  return {
    key: "active",
    label: "Aktiv",
  };
}

async function buildSellerSoldProductsStatistics(query = {}) {
  const sellerId = String(query.sellerId || "").trim();
  if (!sellerId) {
    throw new HttpError(400, "sellerId talab qilinadi", "SELLER_ID_REQUIRED");
  }

  await backfillSellerProductSalesFromOrders();

  const match = {
    sellerId,
    productId: { $gt: 0 },
  };

  const [seller, rows] = await Promise.all([
    SellerAccount.findOne({ id: sellerId })
      .select("id name logo status")
      .lean(),
    SellerProductSale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$productId",
          title: { $first: "$title" },
          image: { $first: "$image" },
          totalAmount: { $sum: "$amount" },
          totalQuantity: { $sum: "$quantity" },
          orderIds: { $addToSet: "$orderId" },
        },
      },
      {
        $project: {
          productId: "$_id",
          title: 1,
          image: 1,
          totalAmount: 1,
          totalQuantity: 1,
          orderCount: { $size: "$orderIds" },
        },
      },
      { $sort: { totalQuantity: -1, totalAmount: -1, productId: 1 } },
    ]),
  ]);

  const productIds = rows.map((row) => Number(row.productId)).filter(Number.isFinite);
  const products = productIds.length
    ? await Product.find({ id: { $in: productIds } }).lean()
    : [];
  const productMap = new Map(products.map((product) => [Number(product.id), product]));

  let sellerTotalAmount = 0;
  let sellerTotalQuantity = 0;

  const productRows = rows.map((row, index) => {
    const productId = Number(row.productId);
    const product = productMap.get(productId);
    const status = resolveProductDisplayStatus(product);
    const orderCount = toNumber(row.orderCount, 0);
    const totalQuantity = toNumber(row.totalQuantity, 0);
    const totalAmount = toNumber(row.totalAmount, 0);

    sellerTotalAmount += totalAmount;
    sellerTotalQuantity += totalQuantity;

    return {
      rank: index + 1,
      productId,
      title: pickProductTitle(row.title) || pickProductTitle(product?.title) || `Mahsulot #${productId}`,
      image: pickProductImage(product, row.image),
      totalAmount,
      totalQuantity,
      orderCount,
      remainingQuantity: resolveRemainingQuantity(product),
      statusKey: status.key,
      statusLabel: status.label,
    };
  });

  const orderCountRows = await SellerProductSale.aggregate([
    { $match: match },
    { $group: { _id: "$orderId" } },
    { $count: "count" },
  ]);
  const orderCount = toNumber(orderCountRows[0]?.count, 0);

  return {
    periodLabel: "Barcha davr",
    seller: {
      sellerId,
      name: pickSellerName(seller) || sellerId,
      logo: String(seller?.logo || ""),
      totalAmount: sellerTotalAmount,
      totalQuantity: sellerTotalQuantity,
      orderCount,
    },
    products: productRows,
  };
}

module.exports = {
  buildSellerSoldProductsStatistics,
};
