const mongoose = require("mongoose");

const messageChatThreadStateSchema = new mongoose.Schema(
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
    deletedByUserAt: {
      type: Date,
      default: null,
    },
    userMessagesHiddenBeforeAt: {
      type: Date,
      default: null,
    },
    deletedBySellerAt: {
      type: Date,
      default: null,
    },
    sellerMessagesHiddenBeforeAt: {
      type: Date,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    muted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "message_chat_thread_state" },
);

messageChatThreadStateSchema.index({ userId: 1, sellerId: 1 }, { unique: true });

const MessageChatThreadState =
  mongoose.models.MessageChatThreadState ||
  mongoose.model("MessageChatThreadState", messageChatThreadStateSchema);

module.exports = { MessageChatThreadState };
