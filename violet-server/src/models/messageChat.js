const mongoose = require("mongoose");

const messageChatSchema = new mongoose.Schema(
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
    sender: {
      type: String,
      enum: ["user", "seller"],
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "product"],
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    readByUser: {
      type: Boolean,
      default: false,
      index: true,
    },
    readBySeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    replyTo: {
      messageId: { type: String, default: null },
      sender: { type: String, enum: ["user", "seller", null], default: null },
      type: { type: String, enum: ["text", "image", "product", null], default: null },
      preview: { type: String, default: "" },
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "message_chat" },
);

messageChatSchema.index({ userId: 1, sellerId: 1, createdAt: 1 });
messageChatSchema.index({ sellerId: 1, userId: 1, createdAt: -1 });

const MessageChat =
  mongoose.models.MessageChat ||
  mongoose.model("MessageChat", messageChatSchema);

module.exports = { MessageChat };
