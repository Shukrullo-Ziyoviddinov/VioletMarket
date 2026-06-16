require("./config/loadEnv")();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const { activityTrackerMiddleware } = require("./middleware/activityTrackerMiddleware");

const app = express();
const uploadDir = path.resolve(__dirname, "../public/uploads");
const legacyUploadDir = path.resolve(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(activityTrackerMiddleware);
app.use("/uploads", express.static(uploadDir));
// Legacy support: old buildlarda fayllar src/public/uploads ga tushib qolgan bo'lishi mumkin.
app.use("/uploads", express.static(legacyUploadDir));
app.use("/", routes);
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `API topilmadi: ${req.method} ${req.path}. violet-server ni qayta ishga tushiring.`,
    code: "NOT_FOUND",
  });
});
app.use(errorHandler);

async function start() {
  if (config.db.isDatabaseConfigured()) {
    await config.db.connectMongoose();
    console.log("MongoDB Atlas (mongoose) connected");
  } else {
    console.warn("MongoDB: DATABASE_URL yo‘q — server DBsiz ishlaydi");
  }

  app.listen(config.port, () => {
    console.log(`Server http://localhost:${config.port}`);
    console.log(
      "Auth API: POST /api/auth/send-register-code, /api/auth/register, /api/auth/send-login-code, /api/auth/verify-login",
    );
    console.log("Wishlist API: GET /api/wishlist, POST /api/wishlist/toggle");
    console.log("Cart API: GET /api/cart, POST /api/cart/add, PATCH/DELETE /api/cart/items/:itemId");
    console.log("Search API: GET /api/search, GET /api/search/suggestions, GET /api/search/history");
    console.log("ViewedAt API: GET/POST /api/viewed-at (max 20 recently viewed)");
    console.log(
      "Recommendations API: GET /api/recommendations/related/:id (o'xshash mahsulotlar)",
    );
    console.log(
      "TavsiyaEtamiz API: GET /api/recommendations/for-product/:id, /by-history (viewedAt + algoritm)",
    );
    console.log(
      "Flash sale API: GET /api/flash-sale/:productId, POST /api/flash-sale/batch (DB countdown)",
    );
    console.log(
      "Seller API: GET /api/sellers/:sellerId/profile, GET /api/sellers/:sellerId/products",
    );
    console.log(
      "Collections API: GET /api/collections/:categoryName/products (Home load-more)",
    );
    console.log(
      "Seller subscriptions: GET /api/seller-subscriptions/seller/:sellerId, POST /api/seller-subscriptions/toggle",
    );
    console.log(
      "Pending reviews API: GET/POST /api/pending-reviews (yozilmagan sharhlar)",
    );
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
