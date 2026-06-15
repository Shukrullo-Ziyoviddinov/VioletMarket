const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const productTypeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    group: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    collection: "product_types",
    timestamps: true,
    versionKey: false,
  },
);

productTypeSchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "product_type_id");
});

const ProductType = mongoose.model("ProductType", productTypeSchema);

module.exports = { ProductType };
