const Joi = require('joi');

const addToSaveForLaterSchema = Joi.object({
  subcategoryId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'subcategoryId is required',
    'string.length': 'Invalid subcategoryId format',
    'any.required': 'subcategoryId is required'
  }),
  variantId: Joi.string().hex().length(24).optional().allow(null).messages({
    'string.length': 'Invalid variantId format'
  }),
});

module.exports = {
  addToSaveForLaterSchema,
};
