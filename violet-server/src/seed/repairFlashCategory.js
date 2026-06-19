/**
 * Seed dagi flash mahsulotlarini yangi sxemaga ko‘chiradi:
 * categoryName -> mos bo‘lim, flashCategoryName -> "true"
 * Ishlatish: node src/seed/repairFlashCategory.js
 */
const path = require("path");
const fs = require("fs");

require("../config/loadEnv")();

const mongoose = require("mongoose");
const { connectMongoose, isDatabaseConfigured } = require("../config/db");
const { Product } = require("../models");

function loadSeedFlashProducts() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "seedProduct.js"), "utf8").trim());
  return raw.filter(
    (product) =>
      typeof product.id === "number"
      && (product.flashCategoryName === "true" || product.flashCategoryName === true),
  );
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL yo‘q.");
    process.exit(1);
  }

  await connectMongoose();
  const flashProducts = loadSeedFlashProducts();
  let updated = 0;
  let inserted = 0;

  for (const doc of flashProducts) {
    const result = await Product.replaceOne({ id: doc.id }, doc, { upsert: true });
    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }

  const legacyRows = await Product.find({ categoryName: "bigDiscountCollection" }).select({ id: 1 }).lean();
  let legacyUpdated = 0;

  for (const row of legacyRows) {
    const seedMatch = flashProducts.find((item) => item.id === row.id);
    const nextCategoryName = seedMatch?.categoryName || "products";
    const nextDuration = seedMatch?.flashDurationHours || 3;

    const result = await Product.updateMany(
      { id: row.id },
      {
        $set: {
          categoryName: nextCategoryName,
          flashCategoryName: "true",
          flashDurationHours: nextDuration,
        },
      },
    );

    legacyUpdated += result.modifiedCount || 0;
  }

  const activeCount = await Product.countDocuments({
    $or: [{ flashCategoryName: "true" }, { flashCategoryName: true }],
  });

  console.log(
    `Flash: seed=${flashProducts.length}, yangilandi=${updated}, qo‘shildi=${inserted}, legacy=${legacyUpdated}, DB jami=${activeCount}`,
  );

  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
