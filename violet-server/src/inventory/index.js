/**
 * Ombor moduli — checkout / qaytarish / yaroqsiz / qayta kuryer stock amallari.
 * @see productInventoryService.js
 */
const {
  reserveOnCheckout,
  keepReserved,
  discardReserved,
  releaseToWarehouse,
  reReserveForCourier,
} = require("./productInventoryService");

module.exports = {
  reserveOnCheckout,
  keepReserved,
  discardReserved,
  releaseToWarehouse,
  reReserveForCourier,
};
