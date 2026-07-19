/**
 * Mavjud handed_to_courier buyurtmalariga test manzil yozadi.
 * Faqat deliveryAddress null bo'lganlariga.
 *
 * Ishlatish:
 *   node src/scripts/backfillDeliveryAddresses.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectMongoose } = require("../config/db");
const { Order } = require("../models/order");

const SAMPLE_ADDRESSES = [
  {
    city: "Toshkent",
    district: "Chilonzor",
    addressLine: "Toshkent, Chilonzor tumani, Bunyodkor shoh ko'chasi",
    coords: [41.2856, 69.2034],
  },
  {
    city: "Toshkent",
    district: "Yunusobod",
    addressLine: "Toshkent, Yunusobod tumani, Amir Temur ko'chasi",
    coords: [41.3647, 69.2883],
  },
  {
    city: "Toshkent",
    district: "Mirzo Ulug'bek",
    addressLine: "Toshkent, Mirzo Ulug'bek tumani",
    coords: [41.3385, 69.3344],
  },
];

(async () => {
  await connectMongoose();

  const orders = await Order.find({
    "items.trackingStatus": "handed_to_courier",
    $or: [{ deliveryAddress: null }, { deliveryAddress: { $exists: false } }],
  }).sort({ id: 1 });

  console.log("Backfill kerak:", orders.length);

  for (let i = 0; i < orders.length; i += 1) {
    const order = orders[i];
    const sample = SAMPLE_ADDRESSES[i % SAMPLE_ADDRESSES.length];
    order.deliveryAddress = sample;
    await order.save();
    console.log("updated order", order.id, "=>", sample.district, sample.coords);
  }

  await mongoose.disconnect();
  console.log("Done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
