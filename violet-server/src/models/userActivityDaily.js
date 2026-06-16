const mongoose = require("mongoose");

const userActivityDailySchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    visitorKey: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isRegistered: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "user_activity_daily" },
);

userActivityDailySchema.index({ dateKey: 1, visitorKey: 1 }, { unique: true });

const UserActivityDaily =
  mongoose.models.UserActivityDaily ||
  mongoose.model("UserActivityDaily", userActivityDailySchema);

module.exports = { UserActivityDaily };
