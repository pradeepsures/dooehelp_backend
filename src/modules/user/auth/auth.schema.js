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
  referredBy: Joi.string().trim().optional()
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
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().trim().optional(),
  lat: Joi.number().optional(),
  long: Joi.number().optional()
});

module.exports = {
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema
};
