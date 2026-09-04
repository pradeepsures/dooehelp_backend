const Joi = require('joi');

const applyReferralSchema = Joi.object({
  referralCode: Joi.string().trim().optional(),
  code: Joi.string().trim().optional()
}).or('referralCode', 'code').messages({
  'object.missing': 'Referral code is required'
});

module.exports = {
  applyReferralSchema
};
