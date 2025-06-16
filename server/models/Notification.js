import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'job_application',
        'application_status',
        'job_match',
        'message',
        'system',
        'profile_view',
        'connection_request',
        'connection_accepted',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

// Mark notification as unread
notificationSchema.methods.markAsUnread = function () {
  this.read = false;
  this.readAt = undefined;
  return this.save();
};

// Check if notification is expired
notificationSchema.methods.isExpired = function () {
  return this.expiresAt && Date.now() > this.expiresAt;
};

// Create notification
notificationSchema.statics.createNotification = async function (
  recipientId,
  type,
  title,
  message,
  options = {}
) {
  const notification = await this.create({
    recipient: recipientId,
    sender: options.sender,
    type,
    title,
    message,
    data: options.data,
    actionUrl: options.actionUrl,
    priority: options.priority || 'medium',
    expiresAt: options.expiresAt,
  });

  return notification;
};

// Get unread notifications count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    recipient: userId,
    read: false,
  });
};

// Mark all notifications as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    {
      recipient: userId,
      read: false,
    },
    {
      read: true,
      readAt: Date.now(),
    }
  );
};

// Delete expired notifications
notificationSchema.statics.deleteExpired = async function () {
  return await this.deleteMany({
    expiresAt: { $lt: Date.now() },
  });
};

export const Notification = mongoose.model('Notification', notificationSchema); 