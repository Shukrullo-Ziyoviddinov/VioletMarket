const mongoose = require("mongoose");

const supportChatMessageSchema = new mongoose.Schema(
  {
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAccount",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["courier", "admin"],
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
    readByCourier: {
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
  { timestamps: true, collection: "support_chat_messages" },
);

supportChatMessageSchema.index({ deliveryId: 1, createdAt: 1 });
supportChatMessageSchema.index({ deliveryId: 1, createdAt: -1 });

const SupportChatMessage =
  mongoose.models.SupportChatMessage ||
  mongoose.model("SupportChatMessage", supportChatMessageSchema);

module.exports = { SupportChatMessage };
