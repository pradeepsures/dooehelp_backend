const Joi = require('joi');

const addToCartSchema = Joi.object({
  subcategoryId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'subcategoryId is required',
    'string.length': 'Invalid subcategoryId format',
    'any.required': 'subcategoryId is required'
  }),
  variantId: Joi.string().hex().length(24).optional().allow(null).messages({
    'string.length': 'Invalid variantId format'
  }),
  quantity: Joi.number().integer().min(1).optional(),
});

const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'quantity must be a number',
    'any.required': 'quantity is required'
  }),
  variantId: Joi.string().hex().length(24).optional().allow(null).messages({
    'string.length': 'Invalid variantId format'
  }),
});

module.exports = {
  addToCartSchema,
  updateCartSchema,
};
