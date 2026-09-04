const catchAsync = require('../../core/catchAsync');
const adminNotificationService = require('./admin-notification.service');
const { sendSuccess } = require('../../core/response');

exports.getWhoHasRead = catchAsync(async (req, res) => {
  const result = await adminNotificationService.getWhoHasRead(req.query);
  sendSuccess(res, result, 'List of users/vendors who have read notifications retrieved successfully');
});

exports.listAll = catchAsync(async (req, res) => {
  const result = await adminNotificationService.listAll(req.query);
  sendSuccess(res, result, 'Notifications retrieved successfully');
});
