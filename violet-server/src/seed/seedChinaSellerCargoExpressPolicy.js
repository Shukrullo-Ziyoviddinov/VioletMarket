/**
 * seedProduct.js dagi vilianora-market mahsulotlarini DB ga yozadi
 * (to'liq products wipe qilmaydi).
 *
 * Ishlatish: npm run seed:china-cargo
 */
require("../config/loadEnv")();

const fs = require("fs");
const path = require("path");
const { connectMongoose, isDatabaseConfigured, getDatabaseUrl } = require("../config/db");
const { Product, SellerAccount } = require("../models");
const { SellerRatingSummary } = require("../models/sellerRatingSummary");
const { sellers } = require("./seedSellerData");

const CHINA_SELLER_ID = "vilianora-market";

async function upsertChinaSeller() {
  const seller = (sellers || []).find((s) => String(s.id) === CHINA_SELLER_ID);
  if (!seller) {
    throw new Error(`seedSellerData da ${CHINA_SELLER_ID} topilmadi`);
  }

  await SellerAccount.replaceOne({ id: seller.id }, seller, { upsert: true });
  const existingSummary = await SellerRatingSummary.findOne({ sellerId: seller.id });
  if (!existingSummary) {
    await SellerRatingSummary.create({
      sellerId: seller.id,
      totalReviews: 0,
      ratingSum: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0,
    });
  }
  return seller.id;
}

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL / Mongo sozlanmagan");
  }

  await connectMongoose();
  console.log("DB:", getDatabaseUrl());

  await upsertChinaSeller();

  const seedPath = path.join(__dirname, "seedProduct.js");
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8").trim());
  const products = raw.filter((p) => String(p?.sellerId || "") === CHINA_SELLER_ID);

  if (products.length === 0) {
    throw new Error("seedProduct.js da vilianora-market mahsulotlari topilmadi");
  }

  let updated = 0;
  let inserted = 0;

  for (const product of products) {
    const policy = String(product.cargoExpressPolicy || "").trim();
    if (policy !== "unrestricted" && policy !== "standard_only") {
      throw new Error(
        `Mahsulot #${product.id} da cargoExpressPolicy yo'q yoki noto'g'ri: ${product.cargoExpressPolicy}`,
      );
    }

    const patch = {
      sellerId: CHINA_SELLER_ID,
      cargoExpressPolicy: policy,
      approvalStatus: product.approvalStatus || "approved",
      clientActive: product.clientActive !== false,
      pausedBySeller: Boolean(product.pausedBySeller),
      countries: Array.isArray(product.countries) ? product.countries : ["china"],
      productCountry: product.productCountry || "China",
      countriesCategories: product.countriesCategories || "xitoy",
    };

    const exists = await Product.findOne({ id: product.id }).select({ id: 1 }).lean();
    if (exists) {
      await Product.updateMany({ id: product.id }, { $set: patch });
      updated += 1;
      console.log(
        `update #${product.id} → ${policy}, countries=${JSON.stringify(patch.countries)}`,
      );
    } else {
      await Product.create({
        ...product,
        ...patch,
      });
      inserted += 1;
      console.log(
        `insert #${product.id} → ${policy}, countries=${JSON.stringify(patch.countries)}`,
      );
    }
  }

  console.log(`Done from seedProduct.js: updated=${updated}, inserted=${inserted}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
