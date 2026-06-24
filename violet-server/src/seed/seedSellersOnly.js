/**
 * Faqat seller_accounts va seller_registrations ni seed qiladi.
 * Ishlatish: npm run seed:sellers
 */
require("../config/loadEnv")();

const mongoose = require("mongoose");
const { connectMongoose, isDatabaseConfigured } = require("../config/db");
const { SellerAccount } = require("../models/sellerAccount");
const { SellerRegistration } = require("../models/sellerRegistration");
const { SellerRatingSummary } = require("../models/sellerRatingSummary");
const { hashPassword } = require("../utils/password");

async function seedSellersMany() {
  const { sellers } = require("./seedSellerData");
  await SellerAccount.syncIndexes();
  for (const seller of sellers || []) {
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
  }
  console.log(`seller_accounts upsert: ${sellers?.length || 0}`);
}

async function seedSellerRegistrationsMany() {
  const { sellerRegistrations } = require("./seedSellerData");
  await SellerRegistration.syncIndexes();

  for (const item of sellerRegistrations || []) {
    const now = new Date();
    await SellerRegistration.findOneAndUpdate(
      { shopId: item.shopId },
      {
        $set: {
          firstName: item.firstName,
          lastName: item.lastName,
          email: String(item.email).trim().toLowerCase(),
          emailVerified: Boolean(item.emailVerified),
          shopDisplayName: item.shopDisplayName,
          shopId: item.shopId,
          passwordHash: hashPassword(item.demoPassword),
          status: item.status || "approved",
          rejectionReason: "",
          submittedAt: now,
          reviewedAt: now,
        },
      },
      { upsert: true, new: true },
    );
  }

  console.log(`seller_registrations upsert: ${sellerRegistrations?.length || 0}`);
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL .env da topilmadi");
    process.exit(1);
  }

  await connectMongoose();
  console.log("MongoDB:", mongoose.connection.db.databaseName);

  await seedSellersMany();
  await seedSellerRegistrationsMany();

  const accounts = await SellerAccount.countDocuments();
  const registrations = await SellerRegistration.countDocuments();
  console.log(`Jami seller_accounts: ${accounts}, seller_registrations: ${registrations}`);

  await mongoose.disconnect();
  console.log("Seller seed tugadi.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
