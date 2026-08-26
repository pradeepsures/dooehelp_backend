const Joi = require('joi');

const addToSaveForLaterSchema = Joi.object({
  subcategoryId: Joi.string().hex().length(24).optional().messages({
    'string.length': 'Invalid subcategoryId format'
  }),
  variantId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'variantId is required',
    'string.length': 'Invalid variantId format',
    'any.required': 'variantId is required'
  }),
});

module.exports = {
  addToSaveForLaterSchema,
};
