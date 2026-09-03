const Joi = require('joi');

const registerSchema = Joi.object({
  phoneNumber: Joi.string().trim().required().messages({
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required'
  }),
  name: Joi.string().trim().optional(),
  email: Joi.string().email().trim().optional(),
  lat: Joi.number().optional(),
  long: Joi.number().optional(),
  referredBy: Joi.string().trim().optional(),
  address: Joi.string().trim().optional()
});

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
  }),
  fcmToken: Joi.string().trim().optional().allow('', null),
  deviceId: Joi.string().trim().optional().allow('', null)
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().trim().optional(),
  lat: Joi.number().optional(),
  long: Joi.number().optional(),
  address: Joi.string().trim().optional(),
  fcmToken: Joi.string().trim().optional().allow('', null),
  deviceId: Joi.string().trim().optional().allow('', null)
});

module.exports = {
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema
};
