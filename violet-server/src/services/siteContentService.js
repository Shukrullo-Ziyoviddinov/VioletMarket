const {
  CountryCategory,
  BrandCategory,
  NavbarSection,
  HomeBannerSlide,
  FooterAboutSection,
  FooterSocialLink,
  FooterAppStore,
  CargoRegionRate,
  DeliveryRegionPrice,
  VideoBannerItem,
  SellerAccount,
  UzWarehouseLocale,
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
  const [aboutSections, socialMedia, appStores] = await Promise.all([
    FooterAboutSection.find().sort({ id: 1 }).lean(),
    FooterSocialLink.find().sort({ id: 1 }).lean(),
    FooterAppStore.find().sort({ id: 1 }).lean(),
  ]);
  if (!aboutSections.length && !socialMedia.length && !appStores.length) return null;
  return {
    footerData: {
      aboutSections: aboutSections.map(stripMongoMeta),
      socialMedia: socialMedia.map(stripMongoMeta),
      appStores: appStores.map(stripMongoMeta),
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
  getUzWarehouse,
  getDefaultProductPolicy,
};
