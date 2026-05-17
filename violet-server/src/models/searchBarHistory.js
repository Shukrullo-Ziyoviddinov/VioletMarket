const mongoose = require("mongoose");

const searchBarHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["query", "product"],
      required: true,
    },
    query: {
      type: String,
      default: "",
      trim: true,
    },
    productId: {
      type: Number,
    },
  },
  { timestamps: true, collection: "search_bar_history" },
);

searchBarHistorySchema.index(
  { userId: 1, type: 1, query: 1 },
  { unique: true, partialFilterExpression: { type: "query" } },
);

searchBarHistorySchema.index(
  { userId: 1, type: 1, productId: 1 },
  { unique: true, partialFilterExpression: { type: "product" } },
);

const SearchBarHistory =
  mongoose.models.SearchBarHistory ||
  mongoose.model("SearchBarHistory", searchBarHistorySchema);

module.exports = { SearchBarHistory };
