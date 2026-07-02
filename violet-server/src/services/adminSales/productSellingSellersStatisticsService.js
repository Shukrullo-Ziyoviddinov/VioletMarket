const { SellerProductSale } = require("../../models/sellerProductSale");
const { SellerAccount } = require("../../models/sellerAccount");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
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
    product?.image || product?.mainImage || firstColor?.mainImage || product?.images?.[0] || "",
  ).trim();
  return productImage || saleImageValue || "/img/no-image.png";
}

async function buildProductSellingSellersStatistics(query = {}) {
  const productId = Number(query.productId);
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "productId talab qilinadi", "PRODUCT_ID_REQUIRED");
  }

  await backfillSellerProductSalesFromOrders();

  const match = {
    productId,
    sellerId: { $ne: "" },
  };

  const [product, saleSnapshot, rows] = await Promise.all([
    Product.findOne({ id: productId })
      .select("id title image mainImage colors images")
      .lean(),
    SellerProductSale.findOne({ productId })
      .select("title image")
      .lean(),
    SellerProductSale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$sellerId",
          totalAmount: { $sum: "$amount" },
          totalQuantity: { $sum: "$quantity" },
          orderIds: { $addToSet: "$orderId" },
        },
      },
      {
        $project: {
          sellerId: "$_id",
          totalAmount: 1,
          totalQuantity: 1,
          orderCount: { $size: "$orderIds" },
        },
      },
      { $sort: { totalQuantity: -1, totalAmount: -1, sellerId: 1 } },
    ]),
  ]);

  const sellerIds = rows.map((row) => String(row.sellerId || "")).filter(Boolean);
  const sellers = sellerIds.length
    ? await SellerAccount.find({ id: { $in: sellerIds } })
      .select("id name logo status")
      .lean()
    : [];
  const sellerMap = new Map(sellers.map((seller) => [String(seller.id), seller]));

  let productTotalAmount = 0;
  let productTotalQuantity = 0;

  const sellerRows = rows.map((row, index) => {
    const sellerId = String(row.sellerId || "");
    const seller = sellerMap.get(sellerId);
    const totalAmount = toNumber(row.totalAmount, 0);
    const totalQuantity = toNumber(row.totalQuantity, 0);
    const orderCount = toNumber(row.orderCount, 0);

    productTotalAmount += totalAmount;
    productTotalQuantity += totalQuantity;

    return {
      rank: index + 1,
      sellerId,
      name: pickSellerName(seller) || sellerId,
      logo: String(seller?.logo || ""),
      status: String(seller?.status || ""),
      totalAmount,
      totalQuantity,
      orderCount,
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
    product: {
      productId,
      title: pickProductTitle(product?.title) || pickProductTitle(saleSnapshot?.title) || `Mahsulot #${productId}`,
      image: pickProductImage(product, saleSnapshot?.image),
      totalAmount: productTotalAmount,
      totalQuantity: productTotalQuantity,
      orderCount,
    },
    sellers: sellerRows,
  };
}

module.exports = {
  buildProductSellingSellersStatistics,
};
