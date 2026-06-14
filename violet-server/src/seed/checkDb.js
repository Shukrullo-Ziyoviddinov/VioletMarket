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
  CargoRegionRate,
  DeliveryRegionPrice,
  VideoBannerItem,
  SellerAccount,
  UzWarehouseLocale,
  ProductPolicyBlock,
  FlashSaleRuleConfig,
  ProductSectionMetric,
  Counter,
} = require("../models");

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL yo‘q (violet-server/.env).");
    process.exit(1);
  }

  console.log("Ulanmoqda…", getDatabaseUrl().replace(/:([^:@]+)@/, ":****@"));

  try {
    await connectMongoose();
  } catch (e) {
    console.error("Ulanish xatosi:", e.message);
    process.exit(1);
  }

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
    cargo_region_rates: await CargoRegionRate.countDocuments(),
    delivery_region_prices: await DeliveryRegionPrice.countDocuments(),
    video_banner_items: await VideoBannerItem.countDocuments(),
    seller_accounts: await SellerAccount.countDocuments(),
    uz_warehouse_locales: await UzWarehouseLocale.countDocuments(),
    product_policy_blocks: await ProductPolicyBlock.countDocuments(),
    flash_sale_rule_configs: await FlashSaleRuleConfig.countDocuments(),
    product_section_metrics: await ProductSectionMetric.countDocuments(),
    counters: await Counter.countDocuments(),
    products: await Product.countDocuments(),
  };

  console.log("Database:", mongoose.connection.db.databaseName);
  console.log(JSON.stringify(counts, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
