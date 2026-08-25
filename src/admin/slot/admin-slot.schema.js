const Joi = require('joi');

const createSlotSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'A valid ISO date is required',
    'any.required': 'Date is required'
  }),
  timeSlot: Joi.string().trim().required().messages({
    'string.empty': 'Time slot is required',
    'any.required': 'Time slot is required'
  }),
  slotType: Joi.string().valid('morning', 'afternoon', 'evening').required().messages({
    'any.only': 'slotType must be one of [morning, afternoon, evening]',
    'any.required': 'slotType is required'
  }),
  status: Joi.boolean().optional().default(true)
});

const updateSlotSchema = Joi.object({
  date: Joi.date().iso().optional(),
  timeSlot: Joi.string().trim().optional(),
  slotType: Joi.string().valid('morning', 'afternoon', 'evening').optional(),
  status: Joi.boolean().optional(),
  isDeleted: Joi.boolean().optional()
});

module.exports = {
  createSlotSchema,
  updateSlotSchema
};
