const admin = require('../config/firebase');
const User = require('../models/User.model');
const { createLogger } = require('../config/logger');

const logger = createLogger('notificationService');

class NotificationService {
  /**
   * Send push notification directly to an FCM device token
   * @param {string} token 
   * @param {object} payload { title, body, data }
   */
  async sendDirect(token, { title, body, data = {} }) {
    if (!token) {
      logger.warn('sendDirect called without FCM token');
      return { success: false, reason: 'NO_TOKEN' };
    }

    try {
      // Ensure all data values are strings for FCM
      const formattedData = {};
      for (const [key, value] of Object.entries(data)) {
        formattedData[key] = value !== undefined && value !== null ? String(value) : '';
      }

      const message = {
        token,
        notification: {
          title,
          body
        },
        data: formattedData,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'doorhelp_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info({ messageId: response, title }, 'FCM push notification sent successfully');
      return { success: true, messageId: response };
    } catch (error) {
      logger.error({ err: error.message, code: error.code }, 'Failed to send FCM push notification');
      return { success: false, error: error.message, code: error.code };
    }
  }

  /**
   * Send push notification to a user by userId
   * @param {string|mongoose.Types.ObjectId} userId 
   * @param {object} payload { title, body, data }
   */
  async sendToUser(userId, { title, body, data = {} }) {
    try {
      const user = await User.findById(userId).select('_id name phoneNumber fcmToken').lean();
      if (!user) {
        logger.warn({ userId }, 'User not found for notification');
        return { success: false, reason: 'USER_NOT_FOUND' };
      }

      if (!user.fcmToken) {
        logger.info({ userId, name: user.name }, 'User has no FCM token registered, skipping push notification');
        return { success: false, reason: 'NO_FCM_TOKEN' };
      }

      const result = await this.sendDirect(user.fcmToken, { title, body, data });

      // Clean up invalid or expired token
      if (!result.success && (
        result.code === 'messaging/registration-token-not-registered' ||
        result.code === 'messaging/invalid-registration-token'
      )) {
        logger.info({ userId }, 'Invalid or expired FCM token detected, clearing from user record');
        await User.findByIdAndUpdate(userId, { fcmToken: null });
      }

      return result;
    } catch (error) {
      logger.error({ userId, err: error.message }, 'Error in sendToUser notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a vendor by vendorId
   * @param {string|mongoose.Types.ObjectId} vendorId 
   * @param {object} payload { title, body, data }
   */
  async sendToVendor(vendorId, { title, body, data = {} }) {
    try {
      const Vendor = require('../models/Vendor.model');
      const vendor = await Vendor.findById(vendorId).select('_id name phoneNumber fcmToken').lean();
      if (!vendor) {
        logger.warn({ vendorId }, 'Vendor not found for notification');
        return { success: false, reason: 'VENDOR_NOT_FOUND' };
      }

      if (!vendor.fcmToken) {
        logger.info({ vendorId, name: vendor.name }, 'Vendor has no FCM token registered, skipping push notification');
        return { success: false, reason: 'NO_FCM_TOKEN' };
      }

      const result = await this.sendDirect(vendor.fcmToken, { title, body, data });

      // Clean up invalid or expired token
      if (!result.success && (
        result.code === 'messaging/registration-token-not-registered' ||
        result.code === 'messaging/invalid-registration-token'
      )) {
        logger.info({ vendorId }, 'Invalid or expired FCM token detected, clearing from vendor record');
        await Vendor.findByIdAndUpdate(vendorId, { fcmToken: null });
      }

      return result;
    } catch (error) {
      logger.error({ vendorId, err: error.message }, 'Error in sendToVendor notification');
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();

