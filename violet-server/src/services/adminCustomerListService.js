const { User } = require("../models/user");

function formatRegisteredDateLabel(date) {
  if (!date) return "—";

  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

  const [year, month, day] = formatted.split("-");
  return `${year}. ${month}. ${day}`;
}

function mapCustomerRow(user) {
  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;

  return {
    id: user._id.toString(),
    firstName: String(user.firstName || "").trim() || "—",
    lastName: String(user.lastName || "").trim() || "—",
    registeredAt: createdAt ? createdAt.toISOString() : null,
    registeredAtLabel: formatRegisteredDateLabel(createdAt),
  };
}

async function listRegisteredCustomers() {
  const [rows, total] = await Promise.all([
    User.find({})
      .select({ firstName: 1, lastName: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments({}),
  ]);

  return {
    customers: rows.map(mapCustomerRow),
    total,
  };
}

module.exports = {
  listRegisteredCustomers,
};
