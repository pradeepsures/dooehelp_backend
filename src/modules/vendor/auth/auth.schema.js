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
  yearOfExperience: Joi.number().optional(),
  categories: Joi.alternatives().try(Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)), Joi.string().trim()).optional(),
  skills: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().trim()).optional(),
  tools: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().trim()).optional(),
  onlineStatus: Joi.string().valid('online', 'offline').optional(),
  city: Joi.string().trim().optional(),
  address: Joi.string().trim().optional(),
  lat: Joi.number().optional(),
  long: Joi.number().optional(),
  location: Joi.object({
    lat: Joi.number().optional(),
    long: Joi.number().optional()
  }).optional(),
  adharNumber: Joi.string().trim().optional(),
  panNumber: Joi.string().trim().optional(),
  bankAccuntno: Joi.string().trim().optional(),
  ifscCode: Joi.string().trim().optional(),
  accountHolderName: Joi.string().trim().optional(),
  bankName: Joi.string().trim().optional(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema
};
