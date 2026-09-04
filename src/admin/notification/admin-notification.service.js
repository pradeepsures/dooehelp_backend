const Notification = require('../../models/Notification.model');

class AdminNotificationService {
  /**
   * Get list of who has read notifications
   * Returns read notifications populated with user / vendor reader info
   */
  async getWhoHasRead(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      isRead: true,
      isDeleted: false
    };

    if (query.recipientType) {
      filter.recipientType = query.recipientType;
    }

    if (query.notificationId) {
      filter._id = query.notificationId;
    }

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate({
          path: 'recipientId',
          select: 'name phoneNumber email storeName'
        })
        .sort({ readAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const formatted = notifications.map((n) => ({
      notificationId: n._id,
      title: n.title,
      body: n.body,
      recipientType: n.recipientType,
      reader: n.recipientId
        ? {
            id: n.recipientId._id,
            name: n.recipientId.name || 'Unknown',
            phoneNumber: n.recipientId.phoneNumber || '',
            email: n.recipientId.email || '',
            storeName: n.recipientId.storeName || undefined
          }
        : null,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt
    }));

    return {
      notifications: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * List all notifications with optional filters
   */
  async listAll(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (query.recipientType) filter.recipientType = query.recipientType;
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate({
          path: 'recipientId',
          select: 'name phoneNumber email storeName'
        })
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
}

module.exports = new AdminNotificationService();
