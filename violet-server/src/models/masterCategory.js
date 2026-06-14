const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const i18nNameSchema = new mongoose.Schema(
  {
    uz: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const masterCategorySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: i18nNameSchema, required: true },
  },
  {
    collection: "master_categories",
    timestamps: true,
    versionKey: false,
  }
);

masterCategorySchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "master_category_id");
});

const MasterCategory = mongoose.model("MasterCategory", masterCategorySchema);

module.exports = { MasterCategory };
