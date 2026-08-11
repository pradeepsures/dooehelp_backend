const Joi = require('joi');

const addToWishlistSchema = Joi.object({
  subcategoryId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'subcategoryId is required',
    'string.length': 'Invalid subcategoryId format',
    'any.required': 'subcategoryId is required'
  }),
});

module.exports = {
  addToWishlistSchema,
};
