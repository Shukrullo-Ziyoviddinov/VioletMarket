require("./config/loadEnv")();

const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/", routes);

async function start() {
  if (config.db.isDatabaseConfigured()) {
    await config.db.connectMongoose();
    console.log("MongoDB Atlas (mongoose) connected");
  } else {
    console.warn("MongoDB: DATABASE_URL yo‘q — server DBsiz ishlaydi");
  }

  app.listen(config.port, () => {
    console.log(`Server http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
