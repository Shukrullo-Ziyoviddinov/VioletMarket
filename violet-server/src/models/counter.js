const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    collection: "counters",
    timestamps: true,
    versionKey: false,
  },
);

const Counter = mongoose.model("Counter", counterSchema);

module.exports = { Counter };
