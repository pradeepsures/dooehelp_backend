const Joi = require('joi');

const createBookingSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'A valid ISO date is required',
    'any.required': 'Booking date is required'
  }),
  timeSlot: Joi.string().trim().required().messages({
    'string.empty': 'Time slot is required',
    'any.required': 'Time slot is required'
  }),
  slotType: Joi.string().valid('morning', 'afternoon', 'evening').required().messages({
    'any.only': 'slotType must be one of [morning, afternoon, evening]',
    'any.required': 'slotType is required'
  }),
  paymentMode: Joi.string().valid('online', 'cash').required().messages({
    'any.only': 'paymentMode must be one of [online, cash]',
    'any.required': 'paymentMode is required'
  }),
  address: Joi.string().trim().when('userAddressId', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.empty': 'Service address is required',
    'any.required': 'Service address is required'
  }),
  userAddressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid User Address ID format'
  })
});

module.exports = {
  createBookingSchema,
};
