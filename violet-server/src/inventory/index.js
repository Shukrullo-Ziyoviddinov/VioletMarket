/**
 * Ombor moduli — checkout / qaytarish / qayta kuryer stock amallari.
 * @see productInventoryService.js
 */
const {
  reserveOnCheckout,
  keepReserved,
  releaseToWarehouse,
  reReserveForCourier,
} = require("./productInventoryService");

module.exports = {
  reserveOnCheckout,
  keepReserved,
  releaseToWarehouse,
  reReserveForCourier,
};
