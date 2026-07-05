const { Counter } = require("./counter");

function asFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function nextSequence(counterKey) {
  const row = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  return Number(row?.seq || 0);
}

async function assignAutoNumberId(doc, counterKey, field = "id") {
  const current = asFiniteNumber(doc?.[field]);
  if (current != null) return;
  doc[field] = await nextSequence(counterKey);
}

module.exports = { assignAutoNumberId, nextSequence };
