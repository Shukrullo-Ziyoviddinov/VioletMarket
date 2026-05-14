// @ts-nocheck

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
});

productSchema.options.strict = false;
productSchema.options.collection = "products";
productSchema.options.timestamps = false;
productSchema.options.versionKey = false;
productSchema.options.id = false;

const productModel = mongoose.model("Product", productSchema);

module.exports = { Product: productModel };
