const Joi = require('joi');

const addToCartSchema = Joi.object({
  subcategoryId: Joi.string().hex().length(24).optional().messages({
    'string.length': 'Invalid subcategoryId format'
  }),
  variantId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'variantId is required',
    'string.length': 'Invalid variantId format',
    'any.required': 'variantId is required'
  }),
  quantity: Joi.number().integer().min(1).optional(),
});

const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'quantity must be a number',
    'any.required': 'quantity is required'
  }),
});

module.exports = {
  addToCartSchema,
  updateCartSchema,
};
