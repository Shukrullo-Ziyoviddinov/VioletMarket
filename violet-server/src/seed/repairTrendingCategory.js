/**
 * Seed dagi trendingItems mahsulotlarining categoryName ni tiklaydi (upsert).
 * Ishlatish: node src/seed/repairTrendingCategory.js
 */
const path = require("path");
const fs = require("fs");

require("../config/loadEnv")();

const mongoose = require("mongoose");
const { connectMongoose, isDatabaseConfigured } = require("../config/db");
const { Product } = require("../models");

function loadSeedProducts() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "seedProduct.js"), "utf8").trim());
  return raw.filter((p) => p.categoryName === "trendingItems" && typeof p.id === "number");
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL yo‘q.");
    process.exit(1);
  }

  await connectMongoose();
  const trending = loadSeedProducts();
  let updated = 0;
  let inserted = 0;

  for (const doc of trending) {
    const result = await Product.replaceOne({ id: doc.id }, doc, { upsert: true });
    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }

  const count = await Product.countDocuments({ categoryName: "trendingItems" });
  console.log(
    `Trending: seed=${trending.length}, yangilandi=${updated}, qo‘shildi=${inserted}, DB jami=${count}`
  );

  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
