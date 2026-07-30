const mongoose = require("mongoose");

/**
 * Sotuvchi ↔ asosiy admin Yordam chati.
 * Mijoz–siller messageChat dan alohida.
 */
const sellerSupportChatMessageSchema = new mongoose.Schema(
  {
    sellerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["seller", "admin"],
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
    readBySeller: {
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
  { timestamps: true, collection: "seller_support_chat_messages" },
);

sellerSupportChatMessageSchema.index({ sellerId: 1, createdAt: 1 });
sellerSupportChatMessageSchema.index({ sellerId: 1, createdAt: -1 });

const SellerSupportChatMessage =
  mongoose.models.SellerSupportChatMessage ||
  mongoose.model("SellerSupportChatMessage", sellerSupportChatMessageSchema);

module.exports = { SellerSupportChatMessage };
