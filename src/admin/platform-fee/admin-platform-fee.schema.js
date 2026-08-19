const Joi = require('joi');

const createPlatformFeeSchema = Joi.object({
  platformFee: Joi.number().min(0).required().messages({
    'number.base': 'Platform fee must be a number',
    'any.required': 'Platform fee is required',
  }),
  gst: Joi.number().min(0).required().messages({
    'number.base': 'GST percentage must be a number',
    'any.required': 'GST percentage is required',
  }),
  status: Joi.string().valid('active', 'inactive').optional().default('active')
});

const updatePlatformFeeSchema = Joi.object({
  platformFee: Joi.number().min(0).optional(),
  gst: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createPlatformFeeSchema,
  updatePlatformFeeSchema
};
