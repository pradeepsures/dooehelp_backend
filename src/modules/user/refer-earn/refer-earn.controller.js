const catchAsync = require('../../../core/catchAsync');
const userReferAndEarnService = require('./refer-earn.service');
const { sendSuccess } = require('../../../core/response');

const getConfig = catchAsync(async (req, res) => {
  const config = await userReferAndEarnService.getActiveConfig();
  sendSuccess(res, config, 'Refer and earn details retrieved successfully');
});

const validateCode = catchAsync(async (req, res) => {
  const { code } = req.params;
  const phoneNumber = req.user?.phoneNumber || req.query.phoneNumber;
  const result = await userReferAndEarnService.validateReferralCode(code, phoneNumber);
  sendSuccess(
    res,
    {
      isValid: true,
      programTitle: result.config.title,
      referrerBonus: result.config.referrerBonus,
      referredUserBonus: result.config.referredUserBonus
    },
    'Referral code is valid'
  );
});

const getMyReferral = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const stats = await userReferAndEarnService.getMyReferralStats(userId);
  sendSuccess(res, stats, 'User referral details retrieved successfully');
});

const applyCode = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { referralCode, code } = req.body;
  const codeToApply = referralCode || code;
  const result = await userReferAndEarnService.applyReferralCode(userId, codeToApply);
  sendSuccess(res, result, result.message);
});

module.exports = {
  getConfig,
  validateCode,
  getMyReferral,
  applyCode
};
