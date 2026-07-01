const mongoose = require("mongoose");

const chatsSearchHistoriyaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "charts_search_historiya",
    versionKey: false,
  },
);

chatsSearchHistoriyaSchema.index({ userId: 1, sellerId: 1 }, { unique: true });

const ChatsSearchHistoriya =
  mongoose.models.ChatsSearchHistoriya ||
  mongoose.model("ChatsSearchHistoriya", chatsSearchHistoriyaSchema);

module.exports = { ChatsSearchHistoriya };
