const port = parseInt(process.env.PORT || "3001", 10);
const nodeEnv = process.env.NODE_ENV || "development";
const db = require("./db");

module.exports = {
  port,
  nodeEnv,
  db,
};
