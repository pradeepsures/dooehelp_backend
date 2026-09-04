const catchAsync = require('../../../core/catchAsync');
const userNotificationService = require('./user-notification.service');
const { sendSuccess } = require('../../../core/response');

exports.getNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await userNotificationService.getNotifications(userId, req.query);
  sendSuccess(res, result, 'Notifications retrieved successfully');
});

exports.getReadNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await userNotificationService.getReadNotifications(userId, req.query);
  sendSuccess(res, result, 'Read notifications retrieved successfully');
});

exports.getOne = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const result = await userNotificationService.getOne(userId, id);
  sendSuccess(res, result, 'Notification retrieved successfully');
});

exports.markAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const result = await userNotificationService.markAsRead(userId, id);
  sendSuccess(res, result, 'Notification marked as read');
});

exports.deleteNotification = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const result = await userNotificationService.deleteNotification(userId, id);
  sendSuccess(res, result, 'Notification deleted successfully');
});

exports.clearAll = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await userNotificationService.clearAll(userId);
  sendSuccess(res, result, 'All notifications cleared successfully');
});
