const mongoose = require("mongoose");
const { assignAutoNumberId } = require("./autoIncrement");

const nameI18nSchema = new mongoose.Schema(
  {
    uz: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const countryCategorySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: nameI18nSchema, required: true },
    image: { type: String, required: true, trim: true },
    flag: { type: String, default: "", trim: true },
    link: { type: String, required: true, trim: true },
    filterValue: { type: String, required: true, trim: true },
  },
  {
    collection: "country_categories",
    timestamps: true,
    versionKey: false,
  }
);

countryCategorySchema.pre("validate", async function autoAssignId() {
  await assignAutoNumberId(this, "country_category_id");
});

const CountryCategory = mongoose.model("CountryCategory", countryCategorySchema);

module.exports = { CountryCategory };
