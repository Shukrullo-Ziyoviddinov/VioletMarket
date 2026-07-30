/**
 * Mavjud saved addresses / orders / assignments uchun canonical region backfill.
 *
 * Ishlatish:
 *   node src/scripts/backfillDeliveryRegions.js
 *   node src/scripts/backfillDeliveryRegions.js --apply
 *
 * Default: dry-run (faqat report).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectMongoose } = require("../config/db");
const { Order } = require("../models/order");
const { User } = require("../models/user");
const { CourierOrderAssignment } = require("../models/courierOrderAssignment");
const {
  normalizeDeliveryAddress,
} = require("../utils/normalizeDeliveryAddress");

const APPLY = process.argv.includes("--apply");

function summarizeUnresolved(label, rows) {
  console.log(`\n[${label}] unresolved: ${rows.length}`);
  for (const row of rows.slice(0, 30)) {
    console.log("-", row);
  }
  if (rows.length > 30) {
    console.log(`... and ${rows.length - 30} more`);
  }
}

async function backfillUsers() {
  const users = await User.find({
    savedDeliveryAddress: { $ne: null },
  }).select("_id email savedDeliveryAddress");

  let updated = 0;
  const unresolved = [];

  for (const user of users) {
    const normalized = normalizeDeliveryAddress(user.savedDeliveryAddress);
    if (!normalized?.region) {
      unresolved.push({
        userId: String(user._id),
        email: user.email,
        city: user.savedDeliveryAddress?.city || "",
        district: user.savedDeliveryAddress?.district || "",
        addressLine: user.savedDeliveryAddress?.addressLine || "",
      });
      continue;
    }

    const same =
      String(user.savedDeliveryAddress?.region || "") === normalized.region &&
      String(user.savedDeliveryAddress?.city || "") === normalized.city &&
      String(user.savedDeliveryAddress?.district || "") === normalized.district;
    if (same) continue;

    updated += 1;
    if (APPLY) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            savedDeliveryAddress: {
              ...user.savedDeliveryAddress.toObject?.() ||
                user.savedDeliveryAddress,
              ...normalized,
              formatted:
                user.savedDeliveryAddress?.formatted ||
                normalized.addressLine ||
                "",
            },
          },
        },
      );
    }
  }

  return { total: users.length, updated, unresolved };
}

async function backfillOrders() {
  const orders = await Order.find({
    deliveryAddress: { $ne: null },
  }).select("id deliveryAddress");

  let updated = 0;
  const unresolved = [];

  for (const order of orders) {
    const normalized = normalizeDeliveryAddress(order.deliveryAddress);
    if (!normalized?.region) {
      unresolved.push({
        orderId: order.id,
        city: order.deliveryAddress?.city || "",
        district: order.deliveryAddress?.district || "",
        addressLine: order.deliveryAddress?.addressLine || "",
      });
      continue;
    }

    const same =
      String(order.deliveryAddress?.region || "") === normalized.region &&
      String(order.deliveryAddress?.city || "") === normalized.city &&
      String(order.deliveryAddress?.district || "") === normalized.district;
    if (same) continue;

    updated += 1;
    if (APPLY) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { deliveryAddress: normalized } },
      );
    }
  }

  return { total: orders.length, updated, unresolved };
}

async function backfillAssignments() {
  const assignments = await CourierOrderAssignment.find({
    deliveryAddress: { $ne: null },
  }).select("_id orderId deliveryAddress");

  let updated = 0;
  const unresolved = [];

  for (const assignment of assignments) {
    const normalized = normalizeDeliveryAddress(assignment.deliveryAddress);
    if (!normalized?.region) {
      unresolved.push({
        assignmentId: String(assignment._id),
        orderId: assignment.orderId,
        city: assignment.deliveryAddress?.city || "",
        district: assignment.deliveryAddress?.district || "",
        addressLine: assignment.deliveryAddress?.addressLine || "",
      });
      continue;
    }

    const same =
      String(assignment.deliveryAddress?.region || "") === normalized.region &&
      String(assignment.deliveryAddress?.city || "") === normalized.city &&
      String(assignment.deliveryAddress?.district || "") ===
        normalized.district;
    if (same) continue;

    updated += 1;
    if (APPLY) {
      await CourierOrderAssignment.updateOne(
        { _id: assignment._id },
        { $set: { deliveryAddress: normalized } },
      );
    }
  }

  return { total: assignments.length, updated, unresolved };
}

(async () => {
  await connectMongoose();
  console.log(APPLY ? "MODE: apply" : "MODE: dry-run");

  const users = await backfillUsers();
  const orders = await backfillOrders();
  const assignments = await backfillAssignments();

  console.log("\nUsers:", {
    total: users.total,
    updated: users.updated,
    unresolved: users.unresolved.length,
  });
  console.log("Orders:", {
    total: orders.total,
    updated: orders.updated,
    unresolved: orders.unresolved.length,
  });
  console.log("Assignments:", {
    total: assignments.total,
    updated: assignments.updated,
    unresolved: assignments.unresolved.length,
  });

  summarizeUnresolved("users", users.unresolved);
  summarizeUnresolved("orders", orders.unresolved);
  summarizeUnresolved("assignments", assignments.unresolved);

  await mongoose.disconnect();
  console.log("\nDone");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
