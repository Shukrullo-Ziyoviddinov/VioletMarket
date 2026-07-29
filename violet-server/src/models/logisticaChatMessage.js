const mongoose = require("mongoose");

const logisticaChatMessageSchema = new mongoose.Schema(
  {
    logisticaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticaProfile",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["logistica", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    readByLogistica: {
      type: Boolean,
      default: false,
      index: true,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, collection: "logistica_chat_messages" },
);

logisticaChatMessageSchema.index({ logisticaId: 1, createdAt: 1 });
logisticaChatMessageSchema.index({ logisticaId: 1, createdAt: -1 });

const LogisticaChatMessage =
  mongoose.models.LogisticaChatMessage ||
  mongoose.model("LogisticaChatMessage", logisticaChatMessageSchema);

module.exports = { LogisticaChatMessage };
