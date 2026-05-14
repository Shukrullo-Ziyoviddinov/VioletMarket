const mongoose = require("mongoose");

/** Har bir policy bloki alohida hujjat */
const productPolicyBlockSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, unique: true, index: true },
    block: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    collection: "product_policy_blocks",
    timestamps: true,
    versionKey: false,
  }
);

const ProductPolicyBlock = mongoose.model("ProductPolicyBlock", productPolicyBlockSchema);

module.exports = { ProductPolicyBlock };
