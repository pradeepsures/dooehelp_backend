const catchAsync = require('../../core/catchAsync');
const cmsService = require('./cms.service');
const { sendSuccess } = require('../../core/response');

exports.getCms = catchAsync(async (req, res) => {
  const { type, page } = req.params;
  const result = await cmsService.getCms(type, page);
  sendSuccess(res, result, 'CMS retrieved successfully');
});

exports.updateCms = catchAsync(async (req, res) => {
  const { type, page } = req.params;
  const { content } = req.body;
  const result = await cmsService.updateCms(type, page, content);
  sendSuccess(res, result, 'CMS updated successfully');
});
