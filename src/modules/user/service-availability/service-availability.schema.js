const Joi = require('joi');

const checkAvailabilitySchema = Joi.object({
  addressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Address ID must be a valid 24-character hex string',
    'any.required': 'Address ID is required',
    'string.empty': 'Address ID cannot be empty'
  })
});

module.exports = { checkAvailabilitySchema };
