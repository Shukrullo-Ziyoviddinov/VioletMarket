const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminCustomerListService");

const listRegisteredCustomers = asyncHandler(async (req, res) => {
  const data = await service.listRegisteredCustomers();
  res.json({ ok: true, data });
});

module.exports = {
  listRegisteredCustomers,
};
