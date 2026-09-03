const catchAsync = require('../../../core/catchAsync');
const userReferAndEarnService = require('./refer-earn.service');
const { sendSuccess } = require('../../../core/response');

const getConfig = catchAsync(async (req, res) => {
  const config = await userReferAndEarnService.getActiveConfig();
  sendSuccess(res, config, 'Refer and earn details retrieved successfully');
});

module.exports = { getConfig };
