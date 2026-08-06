const Joi = require('joi');

const sendOtpSchema = Joi.object({
  phoneNumber: Joi.string().trim().required().messages({
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required'
  })
});

const verifyOtpSchema = Joi.object({
  phoneNumber: Joi.string().trim().required().messages({
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required'
  }),
  otp: Joi.string().trim().required().messages({
    'string.empty': 'OTP is required',
    'any.required': 'OTP is required'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  yearOfExperience: Joi.number().optional()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema
};
