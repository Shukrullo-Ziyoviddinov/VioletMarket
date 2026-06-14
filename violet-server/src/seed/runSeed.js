/**
 * MongoDB ga barcha seed ma'lumotlarni yozadi.
 * Ishlatish: npm run seed (violet-server papkasida)
 */
const path = require("path");
const fs = require("fs");

require("../config/loadEnv")();

const mongoose = require("mongoose");
const { connectMongoose, isDatabaseConfigured, getDatabaseUrl } = require("../config/db");
const {
  Product,
  CountryCategory,
  BrandCategory,
  BrandCountryFilterValue,
  MasterCategory,
  NavbarSection,
  HomeBannerSlide,
  FooterAboutSection,
  FooterSocialLink,
  FooterAppStore,
  FooterContactLink,
  CargoRegionRate,
  DeliveryRegionPrice,
  VideoBannerItem,
  SellerAccount,
  UzWarehouseLocale,
  UzbProductDeliveryInfo,
  ProductPolicyBlock,
  FlashSaleRuleConfig,
  ShippingCountry,
  ProductSectionMetric,
  Counter,
} = require("../models");
const {
  normalizeProductStockShape,
  validateProductStockRules,
} = require("../utils/productStockRules");

const SEED_DIR = __dirname;

function loadJsonFile(filename) {
  const full = path.join(SEED_DIR, filename);
  return JSON.parse(fs.readFileSync(full, "utf8").trim());
}

/** Eski singleton kolleksiyalar (kind + payload) va `categories` */
async function dropLegacySingletonSiteCollections() {
  const legacy = [
    "categories",
    "navbar",
    "home_banners",
    "footer",
    "cargo",
    "video_banners",
    "sellers",
    "uz_warehouse",
    "default_product_policy",
  ];
  const db = mongoose.connection.db;
  for (const name of legacy) {
    const cols = await db.listCollections({ name }).toArray();
    if (cols.length) {
      await db.dropCollection(name);
      console.log("Eski kolleksiya olib tashlandi:", name);
    }
  }
}

async function seedCategoriesMany() {
  const categories = require("./seedCategories");
  const { filterValues } = require("./seedBrandCountryFilterValues");
  await BrandCountryFilterValue.syncIndexes();
  await CountryCategory.syncIndexes();
  await BrandCategory.syncIndexes();
  await BrandCountryFilterValue.deleteMany({});
  await CountryCategory.deleteMany({});
  await BrandCategory.deleteMany({});

  const filterRows = Array.isArray(filterValues)
    ? filterValues
        .map((row) => ({
          type: String(row?.type || "").trim(),
          filterValue: String(row?.filterValue || "").trim(),
        }))
        .filter((row) => row.type && row.filterValue)
    : [];
  if (filterRows.length) {
    await BrandCountryFilterValue.insertMany(filterRows);
  }

  if (categories.categoriyCountries?.length) {
    const countryDocs = categories.categoriyCountries.map(({ id, ...rest }) => rest);
    await CountryCategory.insertMany(countryDocs);
  }
  if (categories.categoriesBrend?.length) {
    const brandDocs = categories.categoriesBrend.map(({ id, ...rest }) => rest);
    await BrandCategory.insertMany(brandDocs);
  }
  console.log(
    `Kategoriyalar: country_categories=${categories.categoriyCountries?.length || 0}, brand_categories=${categories.categoriesBrend?.length || 0}, brand_country_filter_values=${filterRows.length}`
  );
}

async function seedMasterCategoriesMany() {
  const { masterCategories } = require("./seedMasterCategory");
  await MasterCategory.syncIndexes();
  await MasterCategory.deleteMany({});
  if (masterCategories?.length) {
    const docs = masterCategories.map(({ id, ...rest }) => rest);
    await MasterCategory.insertMany(docs);
  }
  console.log(`Master categories: master_categories=${masterCategories?.length || 0}`);
}

async function seedNavbarMany() {
  const { navbarItems } = require("./seedNavbarItem");
  const masterRows = await MasterCategory.find().sort({ id: 1 }).lean();
  const masterByUz = new Map();
  for (const row of masterRows) {
    const key = String(row?.name?.uz || "").trim();
    if (key) masterByUz.set(key, row);
  }
  await NavbarSection.syncIndexes();
  await NavbarSection.deleteMany({});
  if (navbarItems?.length) {
    const docs = navbarItems.map(({ id, items, ...section }) => ({
      ...section,
      items: Array.isArray(items)
        ? items.map(({ id: itemId, ...item }) => {
            const categoryText = String(item?.category || "").trim();
            const matched = masterByUz.get(categoryText);
            return {
              ...item,
              category: categoryText,
              masterCategoryId: matched?.id,
            };
          })
        : [],
    }));
    await NavbarSection.insertMany(docs);
  }
  console.log(`Navbar: navbar_sections=${navbarItems?.length || 0}`);
}

async function seedHomeBannersMany() {
  const { homeBannerData } = require("./seedHomeBanner");
  const masterRows = await MasterCategory.find().sort({ id: 1 }).lean();
  const masterByUz = new Map();
  for (const row of masterRows) {
    const key = String(row?.name?.uz || "").trim();
    if (key) masterByUz.set(key, row);
  }
  await HomeBannerSlide.syncIndexes();
  await HomeBannerSlide.deleteMany({});
  if (homeBannerData?.length) {
    const docs = homeBannerData.map(({ id, ...rest }) => {
      const categoryText = String(rest?.category || "").trim();
      const matched = masterByUz.get(categoryText);
      return {
        ...rest,
        category: categoryText || undefined,
        masterCategoryId: matched?.id,
      };
    });
    await HomeBannerSlide.insertMany(docs);
  }
  console.log(`Home banners: home_banner_slides=${homeBannerData?.length || 0}`);
}

async function seedFooterMany() {
  const { footerData } = require("./seedFooterData");
  await FooterAboutSection.syncIndexes();
  await FooterSocialLink.syncIndexes();
  await FooterAppStore.syncIndexes();
  await FooterContactLink.syncIndexes();
  await FooterAboutSection.deleteMany({});
  await FooterSocialLink.deleteMany({});
  await FooterAppStore.deleteMany({});
  await FooterContactLink.deleteMany({});
  if (footerData?.aboutSections?.length) {
    const aboutDocs = footerData.aboutSections.map(({ id, ...rest }) => rest);
    await FooterAboutSection.insertMany(aboutDocs);
  }
  if (footerData?.socialMedia?.length) {
    const socialDocs = footerData.socialMedia.map(({ id, ...rest }) => rest);
    await FooterSocialLink.insertMany(socialDocs);
  }
  if (footerData?.appStores?.length) {
    const appDocs = footerData.appStores.map(({ id, ...rest }) => rest);
    await FooterAppStore.insertMany(appDocs);
  }
  if (footerData?.contacts?.length) {
    const contactDocs = footerData.contacts.map(({ id, ...rest }) => rest);
    await FooterContactLink.insertMany(contactDocs);
  }
  console.log(
    `Footer: about=${footerData?.aboutSections?.length || 0}, social=${footerData?.socialMedia?.length || 0}, apps=${footerData?.appStores?.length || 0}, contacts=${footerData?.contacts?.length || 0}`
  );
}

async function seedCargoMany() {
  const { cargoRates, deliveryPrices } = require("./seedCargo");
  await CargoRegionRate.syncIndexes();
  await DeliveryRegionPrice.syncIndexes();
  await CargoRegionRate.deleteMany({});
  await DeliveryRegionPrice.deleteMany({});

  let order = 0;
  const rateDocs = [];
  for (const [key, data] of Object.entries(cargoRates || {})) {
    rateDocs.push({ key, sortOrder: order++, data });
  }
  order = 0;
  const priceDocs = [];
  for (const [key, data] of Object.entries(deliveryPrices || {})) {
    priceDocs.push({ key, sortOrder: order++, data });
  }
  if (rateDocs.length) await CargoRegionRate.insertMany(rateDocs);
  if (priceDocs.length) await DeliveryRegionPrice.insertMany(priceDocs);
  console.log(`Cargo: cargo_region_rates=${rateDocs.length}, delivery_region_prices=${priceDocs.length}`);
}

async function seedShippingCountriesMany() {
  const { shippingCountries } = require("./seedShippingCountry");
  await ShippingCountry.syncIndexes();
  await ShippingCountry.deleteMany({});
  if (shippingCountries?.length) {
    const docs = shippingCountries.map(({ id, ...rest }) => rest);
    await ShippingCountry.insertMany(docs);
  }
  console.log(`Shipping countries: shipping_country=${shippingCountries?.length || 0}`);
}

async function seedVideoBannersMany() {
  const { videoBannerData } = require("./seedVideoBannerData");
  await VideoBannerItem.syncIndexes();
  await VideoBannerItem.deleteMany({});
  if (videoBannerData?.length) {
    const docs = videoBannerData.map(({ id, ...rest }) => rest);
    await VideoBannerItem.insertMany(docs);
  }
  console.log(`Video banners: video_banner_items=${videoBannerData?.length || 0}`);
}

async function seedSellersMany() {
  const { sellers } = require("./seedSellerData");
  await SellerAccount.syncIndexes();
  await SellerAccount.deleteMany({});
  if (sellers?.length) await SellerAccount.insertMany(sellers);
  console.log(`Sellers: seller_accounts=${sellers?.length || 0}`);
}

async function seedUzWarehouseMany() {
  const { uzWarehouseData, chinaWarehouseData } = require("./seedUzWarehouseData");
  await UzWarehouseLocale.syncIndexes();
  await UzWarehouseLocale.deleteMany({});
  const docs = [];
  if (uzWarehouseData?.src) docs.push({ slot: 1, src: uzWarehouseData.src });
  if (chinaWarehouseData?.src) docs.push({ slot: 2, src: chinaWarehouseData.src });
  if (docs.length) await UzWarehouseLocale.insertMany(docs);
  console.log(`Warehouse banners: uz_warehouse_locales=${docs.length}`);
}

async function seedProductPolicyMany() {
  const blocks = loadJsonFile("seedDefaultProductPolicy.js");
  await ProductPolicyBlock.syncIndexes();
  await ProductPolicyBlock.deleteMany({});
  if (Array.isArray(blocks) && blocks.length) {
    const docs = blocks.map((block, order) => ({ order, block }));
    await ProductPolicyBlock.insertMany(docs);
  }
  console.log(`Default product policy: product_policy_blocks=${Array.isArray(blocks) ? blocks.length : 0}`);
}

async function seedUzbProductDeliveryInfoMany() {
  const { uzbProductDeliveryInfo } = loadJsonFile("seedUzbProductDeliveryInfo.json");
  await UzbProductDeliveryInfo.syncIndexes();
  await UzbProductDeliveryInfo.deleteMany({});
  if (uzbProductDeliveryInfo) {
    await UzbProductDeliveryInfo.create({
      key: "default",
      title: uzbProductDeliveryInfo.title,
      text: uzbProductDeliveryInfo.text,
    });
  }
  console.log(`UZB product delivery info: uzb_product_delivery_info=${uzbProductDeliveryInfo ? 1 : 0}`);
}

async function seedFlashSaleRules() {
  const config = require("./seedFlashSaleRules");
  await FlashSaleRuleConfig.syncIndexes();
  await FlashSaleRuleConfig.deleteMany({});
  await FlashSaleRuleConfig.create({
    key: "default",
    minSoldCount: Number(config?.minSoldCount),
    minCartUsers: Number(config?.minCartUsers),
    lowStockThreshold: Number(config?.lowStockThreshold),
    highStockThreshold: Number(config?.highStockThreshold),
    rotateEveryMs: Number(config?.rotateEveryMs),
    active: config?.active !== false,
    liveMinViewers: Number(config?.liveMinViewers),
    liveMaxViewers: Number(config?.liveMaxViewers),
    liveUpdateEveryMs: Number(config?.liveUpdateEveryMs),
    liveModeRotateEveryMs: Number(config?.liveModeRotateEveryMs),
    liveNormalStepMin: Number(config?.liveNormalStepMin),
    liveNormalStepMax: Number(config?.liveNormalStepMax),
    liveSurgeStepMin: Number(config?.liveSurgeStepMin),
    liveSurgeStepMax: Number(config?.liveSurgeStepMax),
    liveCooldownStepMin: Number(config?.liveCooldownStepMin),
    liveCooldownStepMax: Number(config?.liveCooldownStepMax),
    liveSpikeChancePercent: Number(config?.liveSpikeChancePercent),
  });
  console.log("Flash sale rules: flash_sale_rule_configs=1");
}

async function seedSiteCollections() {
  await dropLegacySingletonSiteCollections();
  await seedMasterCategoriesMany();
  await seedCategoriesMany();
  await seedNavbarMany();
  await seedHomeBannersMany();
  await seedFooterMany();
  await seedCargoMany();
  await seedShippingCountriesMany();
  await seedVideoBannersMany();
  await seedSellersMany();
  await seedUzWarehouseMany();
  await seedUzbProductDeliveryInfoMany();
  await seedProductPolicyMany();
  await seedFlashSaleRules();
}

async function dropLegacyAppContents() {
  const cols = await mongoose.connection.db.listCollections({ name: "app_contents" }).toArray();
  if (cols.length) {
    await mongoose.connection.db.dropCollection("app_contents");
    console.log("Eski app_contents kolleksiyasi olib tashlandi.");
  }
}

async function seedProducts() {
  const raw = loadJsonFile("seedProduct.js");
  const stockValidationErrors = [];
  raw.forEach((product, index) => {
    const shapeIssues = normalizeProductStockShape(product);
    const ruleIssues = validateProductStockRules(product);
    if (shapeIssues.length === 0 && ruleIssues.length === 0) return;

    stockValidationErrors.push({
      index,
      id: product?.id ?? null,
      shapeIssues,
      ruleIssues,
    });
  });
  if (stockValidationErrors.length > 0) {
    const preview = stockValidationErrors
      .slice(0, 8)
      .map((item) => {
        const idText = item.id != null ? `id=${item.id}` : "id=unknown";
        const shapeText =
          item.shapeIssues.length > 0
            ? `shape:[${item.shapeIssues.join(", ")}]`
            : null;
        const ruleText =
          item.ruleIssues.length > 0
            ? `rules:[${item.ruleIssues.join(" | ")}]`
            : null;
        return `#${item.index} (${idText}) ${[shapeText, ruleText].filter(Boolean).join(" ")}`;
      })
      .join("\n");
    throw new Error(
      `Seed stock validation failed (${stockValidationErrors.length} ta mahsulot):\n${preview}`,
    );
  }

  const products = raw.filter((p) => typeof p.id === "number" && Number.isFinite(p.id));
  const skipped = raw.length - products.length;
  if (skipped) {
    console.warn(`Ogohlantirish: id yo‘q yoki raqam emas — ${skipped} yozuv tashlandi.`);
  }

  const seenIds = new Set();
  const uniqueProducts = [];
  let duplicateIds = 0;
  for (const p of products) {
    if (seenIds.has(p.id)) {
      duplicateIds += 1;
      continue;
    }
    seenIds.add(p.id);
    uniqueProducts.push(p);
  }

  if (duplicateIds) {
    console.warn(`Ogohlantirish: takroriy id — ${duplicateIds} yozuv tashlandi (bir id bir marta).`);
  }

  await Product.deleteMany({});
  await ProductSectionMetric.deleteMany({});
  await Counter.syncIndexes();
  await Product.syncIndexes();
  await ProductSectionMetric.syncIndexes();

  const batch = 100;
  for (let i = 0; i < uniqueProducts.length; i += batch) {
    const slice = uniqueProducts.slice(i, i + batch);
    try {
      await Product.insertMany(slice, { ordered: false });
    } catch (e) {
      console.error(`insertMany xato (partiya ${i}–${i + slice.length}):`, e.message);
      if (e.writeErrors?.length) {
        console.error("Birinchi xato:", e.writeErrors[0]?.errmsg);
      }
      throw e;
    }
  }

  const maxProductId = uniqueProducts.reduce(
    (max, row) => Math.max(max, Number(row?.id) || 0),
    0,
  );
  await Counter.findOneAndUpdate(
    { key: "product_id" },
    { $set: { seq: maxProductId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const chinaSellerCount = uniqueProducts.filter(
    (p) => String(p.sellerCountry || "").trim().toLowerCase() === "china"
  ).length;
  console.log(`Products inserted: ${uniqueProducts.length} (JSON jami: ${raw.length}, takrorlar chiqarildi)`);
  console.log(`sellerCountry=China: ${chinaSellerCount} ta mahsulot`);
}

async function logDbSummary() {
  const dbName = mongoose.connection.db?.databaseName;
  const counts = {
    master_categories: await MasterCategory.countDocuments(),
    country_categories: await CountryCategory.countDocuments(),
    brand_categories: await BrandCategory.countDocuments(),
    brand_country_filter_values: await BrandCountryFilterValue.countDocuments(),
    navbar_sections: await NavbarSection.countDocuments(),
    home_banner_slides: await HomeBannerSlide.countDocuments(),
    footer_about_sections: await FooterAboutSection.countDocuments(),
    footer_social_links: await FooterSocialLink.countDocuments(),
    footer_app_stores: await FooterAppStore.countDocuments(),
    footer_contact_links: await FooterContactLink.countDocuments(),
    cargo_region_rates: await CargoRegionRate.countDocuments(),
    delivery_region_prices: await DeliveryRegionPrice.countDocuments(),
    shipping_country: await ShippingCountry.countDocuments(),
    video_banner_items: await VideoBannerItem.countDocuments(),
    seller_accounts: await SellerAccount.countDocuments(),
    uz_warehouse_locales: await UzWarehouseLocale.countDocuments(),
    uzb_product_delivery_info: await UzbProductDeliveryInfo.countDocuments(),
    product_policy_blocks: await ProductPolicyBlock.countDocuments(),
    flash_sale_rule_configs: await FlashSaleRuleConfig.countDocuments(),
    product_section_metrics: await ProductSectionMetric.countDocuments(),
    counters: await Counter.countDocuments(),
    products: await Product.countDocuments(),
  };
  console.log("--- DB tekshiruv ---");
  console.log("Database:", dbName);
  console.log(JSON.stringify(counts, null, 2));
  console.log("---------------------");
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL bo‘sh. Fayl: violet-server/.env");
    process.exit(1);
  }

  const url = getDatabaseUrl();
  const masked = url.replace(/:([^:@]+)@/, ":****@");
  console.log("Ulanish:", masked);

  try {
    await connectMongoose();
  } catch (e) {
    console.error("\nMongoDB ga ulanib bo‘lmadi.");
    console.error("Xato:", e.message);

    if (String(e.message).includes("querySrv") || String(e.code) === "ECONNREFUSED") {
      console.error("\n(querySrv / DNS) — bu odatda Atlas login emas:");
      console.error("• VPN ni o‘chirib qayta urinib ko‘ring");
      console.error("• Windows tarmoq DNS: 8.8.8.8 yoki 1.1.1.1");
      console.error("• Kod avtomatik SRV ni Google DNS orqali yechishga urinadi; baribir xato bo‘lsa:");
      console.error("  .env ga DATABASE_URL_STANDARD= qo‘ying (Atlasdan mongodb://... qator, SRVsiz)");
      console.error("• PowerShell: nslookup -type=SRV _mongodb._tcp.backend.gci5wgw.mongodb.net");
    } else {
      console.error("\nTekshiring:");
      console.error("1) Atlas → Network Access: IP (0.0.0.0/0) yoki sizning IP");
      console.error("2) Database Access: foydalanuvchi va parol");
      console.error("3) Internet / DNS (VPN, firewall, provayder)");
    }
    process.exit(1);
  }

  console.log("MongoDB ulanishi OK, database:", mongoose.connection.db.databaseName);

  await seedSiteCollections();
  console.log("Site kolleksiyalari yangilandi (alohida hujjatlar).");

  await dropLegacyAppContents();

  await seedProducts();

  await logDbSummary();

  await mongoose.disconnect();
  console.log("Seed tugadi.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
