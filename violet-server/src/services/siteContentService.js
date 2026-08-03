const {
  CountryCategory,
  BrandCategory,
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
} = require("../models");

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

function objectFromKeyedRows(rows, keyField = "key", valueField = "data") {
  const out = {};
  for (const row of rows) {
    const k = row[keyField];
    if (k != null) out[k] = row[valueField];
  }
  return out;
}

async function getCategories() {
  const [categoriyCountries, categoriesBrend] = await Promise.all([
    CountryCategory.find().sort({ id: 1 }).lean(),
    BrandCategory.find().sort({ id: 1 }).lean(),
  ]);
  if (!categoriyCountries.length && !categoriesBrend.length) return null;
  return {
    categoriyCountries: categoriyCountries.map(stripMongoMeta),
    categoriesBrend: categoriesBrend.map(stripMongoMeta),
  };
}

async function getNavbar() {
  const sections = await NavbarSection.find().sort({ id: 1 }).lean();
  if (!sections.length) return null;
  return { navbarItems: sections.map(stripMongoMeta) };
}

async function getHomeBanner() {
  const slides = await HomeBannerSlide.find().sort({ id: 1 }).lean();
  if (!slides.length) return null;
  return { homeBannerData: slides.map(stripMongoMeta) };
}

async function getFooter() {
  const [aboutSections, socialMedia, appStores, contacts] = await Promise.all([
    FooterAboutSection.find().sort({ id: 1 }).lean(),
    FooterSocialLink.find().sort({ id: 1 }).lean(),
    FooterAppStore.find().sort({ id: 1 }).lean(),
    FooterContactLink.find().sort({ id: 1 }).lean(),
  ]);
  if (!aboutSections.length && !socialMedia.length && !appStores.length && !contacts.length) return null;
  return {
    footerData: {
      aboutSections: aboutSections.map(stripMongoMeta),
      socialMedia: socialMedia.map(stripMongoMeta),
      appStores: appStores.map(stripMongoMeta),
      contacts: contacts.map(stripMongoMeta),
    },
  };
}

async function getCargo() {
  const [rateRows, priceRows] = await Promise.all([
    CargoRegionRate.find().sort({ sortOrder: 1 }).lean(),
    DeliveryRegionPrice.find().sort({ sortOrder: 1 }).lean(),
  ]);
  if (!rateRows.length && !priceRows.length) return null;
  return {
    cargoRates: objectFromKeyedRows(rateRows),
    deliveryPrices: objectFromKeyedRows(priceRows),
  };
}

async function getVideoBanner() {
  const items = await VideoBannerItem.find().sort({ id: 1 }).lean();
  if (!items.length) return null;
  return { videoBannerData: items.map(stripMongoMeta) };
}

async function getSellers() {
  const accounts = await SellerAccount.find().sort({ id: 1 }).lean();
  if (!accounts.length) return null;
  return { sellers: accounts.map(stripMongoMeta) };
}

async function getUzWarehouse() {
  const rows = await UzWarehouseLocale.find().sort({ slot: 1 }).lean();
  if (!rows.length) return null;

  const result = {};
  const uzRow = rows.find((r) => r.slot === 1);
  const chinaRow = rows.find((r) => r.slot === 2);

  if (uzRow?.src) {
    result.uzWarehouseData = { src: stripMongoMeta(uzRow).src };
  }
  if (chinaRow?.src) {
    result.chinaWarehouseData = { src: stripMongoMeta(chinaRow).src };
  }

  return Object.keys(result).length ? result : null;
}

async function getUzbProductDeliveryInfo() {
  const row = await UzbProductDeliveryInfo.findOne({ key: "default" }).lean();
  if (!row) return null;
  return {
    deliveryInfo: {
      title: row.title,
      text: row.text,
    },
  };
}

const { DEFAULT_TOP_SELLERS_LIMIT } = require("../topSellers");

async function getTopSellers(limit = DEFAULT_TOP_SELLERS_LIMIT) {
  const {
    buildTopSellersFromDatabase,
    mapTopSellerForClient,
  } = require("../topSellers");

  const rows = await buildTopSellersFromDatabase({
    limit: Math.max(1, Number(limit) || DEFAULT_TOP_SELLERS_LIMIT),
    onlyActive: true,
  });

  return {
    items: rows.map(mapTopSellerForClient),
  };
}

/** @deprecated Use getTopSellers */
async function getTopSillers(limit) {
  return getTopSellers(limit);
}

/** Frontend to'g'ridan-to'g'ri massiv kutadi */
async function getDefaultProductPolicy() {
  const blocks = await ProductPolicyBlock.find().sort({ order: 1 }).lean();
  if (!blocks.length) return null;
  return blocks.map((b) => b.block);
}

module.exports = {
  getCategories,
  getNavbar,
  getHomeBanner,
  getFooter,
  getCargo,
  getVideoBanner,
  getSellers,
  getTopSellers,
  getTopSillers,
  getUzWarehouse,
  getUzbProductDeliveryInfo,
  getDefaultProductPolicy,
};
