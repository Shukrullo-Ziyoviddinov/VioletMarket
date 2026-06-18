const { User } = require("../models/user");
const { UserActivityDaily } = require("../models/userActivityDaily");

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

function formatLastActivityLabel(date) {
  if (!date) return "Ma'lumot yo'q";

  const dateFormatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

  const timeFormatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));

  const [year, month, day] = dateFormatted.split("-");
  return `${year}. ${month}. ${day}, ${timeFormatted}`;
}

function mapCustomerRow(user, lastActivityByUserId) {
  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
  const userId = user._id.toString();
  const lastActiveAt = lastActivityByUserId.get(userId) || null;
  const lastActiveDate = lastActiveAt ? new Date(lastActiveAt) : null;

  return {
    id: userId,
    firstName: String(user.firstName || "").trim() || "—",
    lastName: String(user.lastName || "").trim() || "—",
    registeredAt: createdAt ? createdAt.toISOString() : null,
    registeredAtLabel: formatRegisteredDateLabel(createdAt),
    lastActiveAt: lastActiveDate ? lastActiveDate.toISOString() : null,
    lastActiveAtLabel: formatLastActivityLabel(lastActiveDate),
  };
}

async function loadLastActivityByUserId() {
  const rows = await UserActivityDaily.aggregate([
    {
      $match: {
        isRegistered: true,
        userId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$userId",
        lastActiveAt: { $max: "$lastSeenAt" },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.lastActiveAt]));
}

async function listRegisteredCustomers() {
  const [rows, total, lastActivityByUserId] = await Promise.all([
    User.find({})
      .select({ firstName: 1, lastName: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments({}),
    loadLastActivityByUserId(),
  ]);

  return {
    customers: rows.map((user) => mapCustomerRow(user, lastActivityByUserId)),
    total,
  };
}

module.exports = {
  listRegisteredCustomers,
};
