const Notification = require('../../../models/Notification.model');
const AppError = require('../../../core/AppError');

class UserNotificationService {
  /**
   * Get all notifications for user with pagination
   */
  async getNotifications(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      recipientType: 'user',
      recipientId: userId,
      isDeleted: false
    };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get only read notifications for user
   */
  async getReadNotifications(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      recipientType: 'user',
      recipientId: userId,
      isRead: true,
      isDeleted: false
    };

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate({ path: 'recipientId', select: 'name phoneNumber email' })
        .sort({ readAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single notification by id (and mark as read if not already)
   */
  async getOne(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientType: 'user',
      recipientId: userId,
      isDeleted: false
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientType: 'user',
      recipientId: userId,
      isDeleted: false
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientType: 'user',
      recipientId: userId,
      isDeleted: false
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    notification.isDeleted = true;
    await notification.save();

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Clear all notifications for user
   */
  async clearAll(userId) {
    const result = await Notification.updateMany(
      {
        recipientType: 'user',
        recipientId: userId,
        isDeleted: false
      },
      {
        $set: { isDeleted: true }
      }
    );

    return {
      message: 'All notifications cleared successfully',
      modifiedCount: result.modifiedCount
    };
  }
}

module.exports = new UserNotificationService();
