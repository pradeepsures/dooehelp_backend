const catchAsync = require('../../../core/catchAsync');
const vendorNotificationService = require('./vendor-notification.service');
const { sendSuccess } = require('../../../core/response');

exports.getNotifications = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const result = await vendorNotificationService.getNotifications(vendorId, req.query);
  sendSuccess(res, result, 'Vendor notifications retrieved successfully');
});

exports.getReadNotifications = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const result = await vendorNotificationService.getReadNotifications(vendorId, req.query);
  sendSuccess(res, result, 'Read vendor notifications retrieved successfully');
});

exports.getOne = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const { id } = req.params;
  const result = await vendorNotificationService.getOne(vendorId, id);
  sendSuccess(res, result, 'Vendor notification retrieved successfully');
});

exports.markAsRead = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const { id } = req.params;
  const result = await vendorNotificationService.markAsRead(vendorId, id);
  sendSuccess(res, result, 'Vendor notification marked as read');
});

exports.deleteNotification = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const { id } = req.params;
  const result = await vendorNotificationService.deleteNotification(vendorId, id);
  sendSuccess(res, result, 'Vendor notification deleted successfully');
});

exports.clearAll = catchAsync(async (req, res) => {
  const vendorId = (req.vendor || req.user)._id;
  const result = await vendorNotificationService.clearAll(vendorId);
  sendSuccess(res, result, 'All vendor notifications cleared successfully');
});
