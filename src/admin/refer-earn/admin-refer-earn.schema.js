const Joi = require('joi');

const createReferAndEarnSchema = Joi.object({
  title: Joi.string().trim().optional().default('Refer and Earn'),
  referrerBonus: Joi.number().min(0).required().messages({
    'number.base': 'Referrer bonus must be a number',
    'number.min': 'Referrer bonus cannot be negative',
    'any.required': 'Referrer bonus is required',
  }),
  referredUserBonus: Joi.number().min(0).required().messages({
    'number.base': 'Referred user bonus must be a number',
    'number.min': 'Referred user bonus cannot be negative',
    'any.required': 'Referred user bonus is required',
  }),
  description: Joi.string().allow('').optional().default(''),
  status: Joi.string().valid('active', 'inactive').optional().default('active'),
});

const updateReferAndEarnSchema = Joi.object({
  title: Joi.string().trim().optional(),
  referrerBonus: Joi.number().min(0).optional(),
  referredUserBonus: Joi.number().min(0).optional(),
  description: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  isDeleted: Joi.boolean().optional(),
});

module.exports = {
  createReferAndEarnSchema,
  updateReferAndEarnSchema,
};
