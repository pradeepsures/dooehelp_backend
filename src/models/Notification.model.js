const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['user', 'vendor', 'admin'],
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientTypeModel',
      index: true
    },
    recipientTypeModel: {
      type: String,
      enum: ['User', 'Vendor', 'Admin'],
      default: function () {
        if (this.recipientType === 'user') return 'User';
        if (this.recipientType === 'vendor') return 'Vendor';
        if (this.recipientType === 'admin') return 'Admin';
        return 'User';
      }
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientType: 1, recipientId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
