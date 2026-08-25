const Joi = require('joi');

const createPlatformFeeSchema = Joi.object({
  platformFee: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Platform fee must be a number',
    'number.max': 'Platform fee percentage cannot exceed 100%',
    'any.required': 'Platform fee is required',
  }),
  gst: Joi.number().min(0).max(100).required().messages({
    'number.base': 'GST percentage must be a number',
    'number.max': 'GST percentage cannot exceed 100%',
    'any.required': 'GST percentage is required',
  }),
  status: Joi.string().valid('active', 'inactive').optional().default('active')
});

const updatePlatformFeeSchema = Joi.object({
  platformFee: Joi.number().min(0).max(100).optional(),
  gst: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createPlatformFeeSchema,
  updatePlatformFeeSchema
};
