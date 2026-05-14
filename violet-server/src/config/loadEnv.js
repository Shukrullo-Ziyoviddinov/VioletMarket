const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

/**
 * violet-server/.env ni aniq yo‘ldan yuklaydi (cwd ga bog‘liq emas).
 * src/config → 2 daraja yuqori = violet-server ildizi.
 */
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.warn(`[loadEnv] Fayl topilmadi: ${envPath}`);
    dotenv.config();
    return;
  }
  dotenv.config({ path: envPath });
}

module.exports = loadEnv;
